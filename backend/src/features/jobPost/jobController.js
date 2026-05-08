const asyncHandler = require("../../middleware/asyncHandler");
const hf = require("../../services/hfService");
const JobPost = require("./jobPost");
const User = require("../user/User");
const AuditLog = require("../auditLog/auditLog");
const Report = require("../reports/reports");
const Referral = require("../referrals/Referral");
const { AuditAction, JobStatus, UserStatus } = require("../../enums");
const cosineSimilarity = require("../../utils/cosineSimilarity");

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
    const openJobs = await JobPost.find({ status: 'open', 'embeddings.0': { $exists: true } }).lean();

    if (openJobs.length === 0) {
        const fallbackJobs = await JobPost.find({ status: 'open' }).lean();
        return res.status(200).json({ success: true, jobs: fallbackJobs });
    }

    try {
        const studentEmbedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: studentText,
        });

        const jobs = openJobs
            .map(({ embeddings, __v, ...job }) => ({
                ...job,
                score: cosineSimilarity(studentEmbedding, embeddings),
            }))
            .sort((a, b) => b.score - a.score);

        return res.status(200).json({ success: true, jobs });
    } catch (hfError) {
        console.error("HuggingFace recommendations failed:", hfError.message);
        return res.status(200).json({ success: true, jobs: openJobs.map(({ embeddings, __v, ...job }) => job) });
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
    if (location) filter['location.city'] = { $regex: location, $options: 'i' };
    if (type) filter.type = type;

    if (keyword) filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
    ];

    if (req.query.isRemote !== undefined) filter.isRemote = req.query.isRemote === 'true';
    if (req.query.workplaceType) filter.workplaceType = req.query.workplaceType;
    if (req.query.requiredEducation) filter.requiredEducation = req.query.requiredEducation;
    if (req.query.minExperience) filter['experience.minYears'] = { $lte: parseInt(req.query.minExperience) };
    if (req.query.requiresCv !== undefined) filter.requiresCv = req.query.requiresCv === 'true';
    if (req.query.salaryMin) filter['salary.normalizedUSD'] = { $gte: parseFloat(req.query.salaryMin) };

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
    const job = await JobPost.findByIdAndUpdate(
        req.params.id,
        { $inc: { viewCount: 1 } },
        { new: true }
    ).populate('createdBy', 'name email');

    if (!job) return next(createError(404, 'Job not found'));

    res.status(200).json({ success: true, job });
});

// POST /api/v1/jobs
const createJob = asyncHandler(async (req, res, next) => {
    if (req.user.status !== UserStatus.APPROVED) {
        return next(createError(403, "Your account is pending approval. Wait for admin approval before posting jobs."));
    }

    const { title, company, description, requirements, location, type, salary, totalSlots, applicationDeadline, requiresCv, requiresCoverLetter, experience, requiredEducation, requiredEducationField, workplaceType, perks, hiringStages } = req.body;

    if (!title || !company || !description || !requirements || requirements.length === 0 || !location || !type) {
        return next(createError(400, "Please provide all required fields"));
    }

    if (location && (!location.city || !location.country)) {
        return next(createError(400, 'location must include city and country'));
    }

    if (salary && salary.min && salary.max && salary.min > salary.max) {
        return next(createError(400, 'salary.min cannot be greater than salary.max'));
    }

    if (experience && experience.minYears < 0) {
        return next(createError(400, 'experience.minYears cannot be negative'));
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

    let embeddings = [];
    try {
        const jobText = `${title} ${requirements.join(' ')}`;
        const embedding = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: jobText,
        });
        embeddings = embedding;
    } catch (embErr) {
        console.error('Embedding computation failed:', embErr.message);
    }

    const job = await JobPost.create({
        title, company, description, requirements, location, type, salary, totalSlots, applicationDeadline, requiresCv, requiresCoverLetter, experience, requiredEducation, requiredEducationField, workplaceType, perks, hiringStages, category, aiCategoryConfidence, embeddings, createdBy: req.user._id,
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

    if (job.status !== JobStatus.OPEN) {
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
    if (req.user.status !== UserStatus.APPROVED) {
        return next(createError(403, "Your account is pending approval. Wait for admin approval before posting jobs."));
    }

    const job = await JobPost.findById(req.params.id);

    if (!job) return next(createError(404, "Job not found"));

    if (job.createdBy.toString() !== req.user._id.toString()) {
        return next(createError(403, "Not authorised to edit this job"));
    }

    const originalDescription = job.description;

    const previousStatus = job.status;

    const fields = ["title", "company", "description", "requirements", "location", "type", "salary", "totalSlots", "status", "applicationDeadline", "requiresCv", "requiresCoverLetter", "experience", "requiredEducation", "requiredEducationField", "workplaceType", "perks", "hiringStages"];

    for (const field of fields) {
        if (req.body[field] !== undefined) {
            job[field] = req.body[field];
        }
    }

    if (req.body.location && (!req.body.location.city || !req.body.location.country)) {
        return next(createError(400, 'location must include city and country'));
    }

    if (req.body.salary && req.body.salary.min && req.body.salary.max && req.body.salary.min > req.body.salary.max) {
        return next(createError(400, 'salary.min cannot be greater than salary.max'));
    }

    if (req.body.experience && req.body.experience.minYears < 0) {
        return next(createError(400, 'experience.minYears cannot be negative'));
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

    const needsReembedding = ['title', 'description', 'requirements'].some(
        f => req.body[f] !== undefined
    );

    if (needsReembedding) {
        try {
            const jobText = `${job.title} ${job.requirements.join(' ')}`;
            const embedding = await hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: jobText,
            });
            job.embeddings = embedding;
        } catch (embErr) {
            console.error('Embedding recomputation failed:', embErr.message);
        }
    }

    await job.save();

    if (previousStatus !== JobStatus.CLOSED && job.status === JobStatus.CLOSED) {
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
    if (req.user.role === "recruiter" && req.user.status !== UserStatus.APPROVED) {
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