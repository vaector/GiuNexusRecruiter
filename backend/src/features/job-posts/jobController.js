const hf = require("../../services/hfService");
const JobPost = require("./JobPost");
const User = require("../user/User");
const { applyToJob } = require("../application/applicationController");

// ─── helpers ────────────────────────────────────────────────────────────────
const createError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ─── GET /api/v1/jobs ────────────────────────────────────────────────────────
const getAllJobs = async (req, res) => {
  try {
    const { category, location, type, status, keyword, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;
    else filter.status = "open";

    if (category) filter.category = category;
    if (location) filter.location = location;
    if (type) filter.type = type;

    if (keyword)
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];

    const skip = (Number(page) - 1) * Number(limit);

    const jobs = await JobPost.find(filter)
      .populate("createdBy", "name email")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await JobPost.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      jobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/v1/jobs/my-jobs ────────────────────────────────────────────────
const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/v1/jobs/saved ──────────────────────────────────────────────────
const getSavedJobs = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await User.findById(userId)
    .select("savedJobs")
    .populate(
      "savedJobs",
      "title company description location type salary category status createdAt"
    );

  if (!user) {
    return next(createError(404, "User not found"));
  }

  return res.status(200).json({
    success: true,
    jobs: user.savedJobs,
  });
});

// ─── GET /api/v1/jobs/:id ────────────────────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/v1/jobs ───────────────────────────────────────────────────────
const createJob = async (req, res, next) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. Wait for admin approval before posting jobs.",
      });
    }

    const { title, company, description, requirements, location, type, salary, totalSlots } =
      req.body;

    if (
      !title ||
      !company ||
      !description ||
      !requirements ||
      requirements.length === 0 ||
      !location ||
      !type
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    let category = "Other";

    try {
      const result = await hf.zeroShotClassification({
        model: "facebook/bart-large-mnli",
        inputs: [description],
        parameters: {
          candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
        },
      });
      category = result[0].labels[0];
    } catch (error) {
      console.error("AI classification failed: ", error.message);
    }

    const job = await JobPost.create({
      title,
      company,
      description,
      requirements,
      location,
      type,
      salary,
      totalSlots,
      category,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/v1/jobs/:id/save  (toggle) ───────────────────────────────────
const toggleSaveJob = asyncHandler(async (req, res, next) => {
  const jobId = req.params.id;
  const userId = req.user._id;

  const job = await JobPost.findById(jobId);
  if (!job) {
    return next(createError(404, "Job not found"));
  }

  const user = await User.findById(userId).select("savedJobs");
  if (!user) {
    return next(createError(404, "User not found"));
  }

  const alreadySaved = user.savedJobs.some((id) => id.equals(jobId));

  if (alreadySaved) {
    await User.findByIdAndUpdate(userId, { $pull: { savedJobs: job._id } });
    return res.status(200).json({
      success: true,
      message: "Job removed from saved",
      saved: false,
    });
  }

  if (job.status !== "open") {
    return next(createError(400, "Cannot save a closed job"));
  }

  await User.findByIdAndUpdate(userId, { $addToSet: { savedJobs: job._id } });
  return res.status(200).json({
    success: true,
    message: "Job saved",
    saved: true,
  });
});

// ─── PATCH /api/v1/jobs/:id ──────────────────────────────────────────────────
const updateJob = async (req, res, next) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending approval. Wait for admin approval before posting jobs.",
      });
    }

    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorised to edit this job" });
    }

    const fields = [
      "title", "company", "description", "requirements",
      "location", "type", "salary", "totalSlots", "status",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    }

    if (req.body.description) {
      try {
        const result = await hf.zeroShotClassification({
          model: "facebook/bart-large-mnli",
          inputs: [req.body.description],
          parameters: {
            candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
          },
        });
        job.category = result[0].labels[0];
      } catch (error) {
        console.error("AI classification failed: ", error.message);
      }
    }

    await job.save();
    return res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/v1/jobs/:id ─────────────────────────────────────────────────
const deleteJob = async (req, res, next) => {
  try {
    const job = await JobPost.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (
      job.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorised to delete this job" });
    }

    await job.deleteOne();
    return res.status(200).json({ success: true, message: "Job deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getMyJobs,
  getSavedJobs,
  getJobById,
  createJob,
  toggleSaveJob,
  updateJob,
  deleteJob,
  applyToJob,
};
