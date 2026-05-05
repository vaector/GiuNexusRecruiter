const Application = require("./Application");
const JobPost = require("../job-posts/JobPost");

const ALLOWED_APPLICATION_STATUSES = ["pending", "shortlisted", "rejected"];

const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await JobPost.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to view applicants for this job",
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate("user", "name email skills profilePicture")
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate("job", "title company type status location category")
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be one of: pending, shortlisted, rejected",
      });
    }

    const application = await Application.findById(id).populate(
      "job",
      "createdBy"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (!application.job) {
      return res.status(404).json({
        success: false,
        message: "Related job not found",
      });
    }

    if (application.job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to update this application",
      });
    }

    application.status = status;
    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate("user", "name email skills")
      .populate("job", "title company type status");

    return res.status(200).json({
      success: true,
      application: updatedApplication,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
};
