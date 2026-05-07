const Application = require("./Application");
const JobPost = require("../job-posts/JobPost");

// GET /api/v1/applications — admin only
const listAllApplications = async (req, res, next) => {
  try {
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

    return res.status(200).json({ success: true, total, page, applications });
  } catch (err) {
    next(err);
  }
};

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

module.exports = { listAllApplications, applyToJob };
