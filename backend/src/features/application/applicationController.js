const asyncHandler = require("../../middleware/asyncHandler");
const Application = require("./Application");
const JobPost = require("../job-posts/JobPost");

const ALLOWED_APPLICATION_STATUSES = ["pending", "shortlisted", "rejected"];

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// GET /api/v1/applications
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

// GET /api/v1/jobs/:jobId/applicants
const getJobApplicants = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await JobPost.findById(jobId);
  if (!job) return next(createError(404, "Job not found"));

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorised to view applicants for this job"));
  }

  const applications = await Application.find({ job: jobId })
    .populate("user", "name email skills profilePicture")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

// GET /api/v1/applications/my
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id })
    .populate("job", "title company type status location category")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

// PATCH /api/v1/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
    return next(createError(400, "Status must be one of: pending, shortlisted, rejected"));
  }

  const application = await Application.findById(id).populate("job", "createdBy");
  if (!application) return next(createError(404, "Application not found"));
  if (!application.job) return next(createError(404, "Related job not found"));

  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorised to update this application"));
  }

  application.status = status;
  await application.save();

  const updatedApplication = await Application.findById(application._id)
    .populate("user", "name email skills")
    .populate("job", "title company type status");

  return res.status(200).json({ success: true, application: updatedApplication });
});

// POST /api/v1/jobs/:jobId/apply — jobSeeker only
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ success: false, message: "Cannot apply to a closed job" });
    }

    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already applied to this job" });
    }

    let application;
    try {
      application = await Application.create({
        user: req.user._id,
        job: jobId,
        ...(coverLetter && { coverLetter }),
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "You have already applied to this job" });
      }
      return next(err);
    }

    return res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAllApplications,
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
  applyToJob,
};