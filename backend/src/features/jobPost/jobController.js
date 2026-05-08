const asyncHandler = require("../../middleware/asyncHandler");
const hf = require("../../services/hfService");
const JobPost = require("./jobPost");
const User = require("../user/User");
const AuditLog = require("../auditLog/auditLog");
const Report = require("../reports/reports");
const Referral = require("../referrals/Referral");
const { AuditAction } = require("../../enums");

function cosineSimilarity(vecA, vecB) {
    const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dot / (magA * magB);
}

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// GET /api/v1/jobs/recommended
const getRecommendedJobs = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("skills");
    if (!user) return next(createError(404, "User not found"));

    const skills = Array.isArray(user.skills) ? user.skills : [];
    const studentText = skills.join(", ");
    const openJobs = await JobPost.find({ status: "open" }).lean();

    if (openJobs.length === 0) {
        return res.status(200).json({ success: true, jobs: [] });
    }

    try {
        const jobTexts = openJobs.map((job) => {
            const reqs = Array.isArray(job.requirements)
                ? job.requirements.join(" ")
                : job.requirements || "";
            return [job.title, reqs].filter(Boolean).join(" ");
        });

        const embeddings = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: [studentText, ...jobTexts],
        });

        const studentVector = embeddings[0];
        const jobs = openJobs
            .map((job, index) => ({
                ...job,
                score: cosineSimilarity(studentVector, embeddings[index + 1]),
            }))
            .map(({ __v, ...job }) => job)
            .sort((a, b) => b.score - a.score);

        return res.status(200).json({ success: true, jobs });
    } catch (hfError) {
        console.error("HuggingFace recommendations failed:", hfError.message);
        return res.status(200).json({ success: true, jobs: openJobs });
    }
});

// GET /api/v1/jobs
const getAllJobs = asyncHandler(async (req, res) => {
    const { category, location, type, status, keyword } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (type) filter.type = type;

    if (keyword) filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
    ];

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
        JobPost.find(filter)
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        JobPost.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        jobs,
    });
});

// GET /api/v1/jobs/my-jobs
const getMyJobs = asyncHandler(async (req, res) => {
    const jobs = await JobPost.find({ createdBy: req.user._id }).sort({
        createdAt: -1,
    });

    res.status(200).json({
        success: true,
        total: jobs.length,
        jobs,
    });
});

// GET /api/v1/jobs/saved
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

// GET /api/v1/jobs/:id
const getJobById = asyncHandler(async (req, res, next) => {
    const job = await JobPost.findById(req.params.id).populate(
        "createdBy",
        "name email"
    );

    if (!job) return next(createError(404, "Job not found"));

    await JobPost.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.status(200).json({ success: true, job });
});

// POST /api/v1/jobs
const createJob = asyncHandler(async (req, res, next) => {
    if (req.user.status !== "approved") {
        return next(createError(403, "Your account is pending approval. Wait for admin approval before posting jobs."));
    }

    const { title, company, description, requirements, location, type, salary, totalSlots, applicationDeadline } = req.body;

    if (!title || !company || !description || !requirements || requirements.length === 0 || !location || !type) {
        return next(createError(400, "Please provide all required fields"));
    }

    let category = "Other";
    let aiCategoryConfidence = null;

    try {
        const result = await hf.zeroShotClassification({
            model: "facebook/bart-large-mnli",
            inputs: description,
            parameters: {
                candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
            },
        });
        // console.log('HF raw result:', JSON.stringify(result, null, 2));
        category = result[0].label;
        aiCategoryConfidence = result[0].score;
    } catch (hfError) {
        console.error("AI classification failed:", hfError.message);
    }

    const job = await JobPost.create({
        title, company, description, requirements, location, type, salary, totalSlots, applicationDeadline, category, aiCategoryConfidence, createdBy: req.user._id,
    });

    await AuditLog.record({
        actor: req.user,
        action: AuditAction.JOB_CREATED,
        targetModel: "JobPost",
        targetId: job._id,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
    });

    return res.status(201).json({ success: true, job });
});

// POST /api/v1/jobs/:id/save (toggle)
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

// PATCH /api/v1/jobs/:id
const updateJob = asyncHandler(async (req, res, next) => {
    if (req.user.status !== "approved") {
        return next(createError(403, "Your account is pending approval. Wait for admin approval before posting jobs."));
    }

    const job = await JobPost.findById(req.params.id);

    if (!job) return next(createError(404, "Job not found"));

    if (job.createdBy.toString() !== req.user._id.toString()) {
        return next(createError(403, "Not authorised to edit this job"));
    }

    const originalDescription = job.description;

    const previousStatus = job.status;

    const fields = ["title", "company", "description", "requirements", "location", "type", "salary", "totalSlots", "status", "applicationDeadline"];

    for (const field of fields) {
        if (req.body[field] !== undefined) {
            job[field] = req.body[field];
        }
    }

    const descriptionChanged =
        Object.prototype.hasOwnProperty.call(req.body, "description") &&
        req.body.description !== originalDescription;

    if (descriptionChanged) {
        try {
            const result = await hf.zeroShotClassification({
                model: "facebook/bart-large-mnli",
                inputs: req.body.description,
                parameters: {
                    candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"],
                },
            });
            job.category = result[0].label;
            job.aiCategoryConfidence = result[0].score;
        } catch (hfError) {
            console.error("AI classification failed:", hfError.message);
        }
    }

    await job.save();

    if (previousStatus !== "closed" && job.status === "closed") {
        await AuditLog.record({
            actor: req.user,
            action: AuditAction.JOB_CLOSED,
            targetModel: "JobPost",
            targetId: job._id,
            metadata: { from: previousStatus, to: job.status },
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
        });
        await Referral.updateMany({ job: job._id, status: "pending" }, { status: "expired" });
    }

    return res.status(200).json({ success: true, job });
});

// DELETE /api/v1/jobs/:id
const deleteJob = asyncHandler(async (req, res, next) => {
    if (req.user.role === "recruiter" && req.user.status !== "approved") {
        return next(createError(403, "Your account is pending approval. Wait for admin approval before managing jobs."));
    }

    const job = await JobPost.findById(req.params.id);

    if (!job) return next(createError(404, "Job not found"));

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return next(createError(403, "Not authorised to delete this job"));
    }

    await job.deleteOne();

    await Report.updateMany(
        { targetModel: 'JobPost', targetId: job._id, status: 'open' },
        { status: 'actioned', adminNote: 'Resolved via job deletion', reviewedBy: req.user._id, reviewedAt: new Date() }
    );

    await AuditLog.record({
        actor: req.user,
        action: AuditAction.JOB_DELETED,
        targetModel: "JobPost",
        targetId: job._id,
        metadata: { title: job.title, company: job.company, status: job.status, createdBy: job.createdBy },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
    });

    return res.status(200).json({ success: true, message: "Job deleted" });
});

module.exports = {
    getAllJobs,
    getMyJobs,
    getSavedJobs,
    getJobById,
    createJob,
    toggleSaveJob,
    updateJob,
    deleteJob,
    getRecommendedJobs,
};