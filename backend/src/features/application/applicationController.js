const asyncHandler = require("../../middleware/asyncHandler");
const Application = require("./Application");
const JobPost = require("../job-posts/JobPost");

const ALLOWED_APPLICATION_STATUSES = ["pending", "shortlisted", "rejected"];

const listAllApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, applications] = await Promise.all([
    Application.countDocuments(),
    Application.find()
      .populate("user", "name email")
      .populate("job", "title company")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({ success: true, total, page, applications });
});

const getJobApplicants = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await JobPost.findById(jobId);

  if (!job) return res.status(404).json({ success: false, message: "Job not found" });

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorised to view applicants for this job" });
  }

  const applications = await Application.find({ job: jobId })
    .populate("user", "name email skills profilePicture")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id })
    .populate("job", "title company type status location category")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be one of: pending, shortlisted, rejected" });
  }

  const application = await Application.findById(id).populate("job", "createdBy");

  if (!application) return res.status(404).json({ success: false, message: "Application not found" });
  if (!application.job) return res.status(404).json({ success: false, message: "Related job not found" });

  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorised to update this application" });
  }

  application.status = status;
  await application.save();

  const updatedApplication = await Application.findById(application._id)
    .populate("user", "name email skills")
    .populate("job", "title company type status");

  return res.status(200).json({ success: true, application: updatedApplication });
});

module.exports = { listAllApplications, getJobApplicants, getMyApplications, updateApplicationStatus };
