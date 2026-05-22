const asyncHandler = require("../../middleware/asyncHandler");
const hf = require("../../services/hfService");
const JobPost = require("./jobPost");
const User = require("../user/User");
const AuditLog = require("../auditLog/auditLog");
const Report = require("../reports/reports");
const Referral = require("../referrals/Referral");
const { AuditAction, JobStatus, UserStatus, ScreeningQuestionType } = require("../../enums");
const cosineSimilarity = require("../../utils/cosineSimilarity");

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateScreeningQuestions = (questions) => {
    if (!Array.isArray(questions)) return 'screeningQuestions must be an array';
    for (const q of questions) {
        if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
            return 'Each screening question must have a non-empty question string';
        }
        if (!Object.values(ScreeningQuestionType).includes(q.type)) {
            return `Question type must be one of: ${Object.values(ScreeningQuestionType).join(', ')}`;
        }
        if (q.type === ScreeningQuestionType.MULTIPLE_CHOICE) {
            if (!Array.isArray(q.options) || q.options.length < 2) {
                return 'Multiple choice questions must have at least 2 options';
            }
        }
    }
    return null;
};

const normalizeLocation = (location) => {
    if (typeof location === 'string') {
        return { city: location };
    }
    return location;
};

const normalizeSalary = (salary) => {
    if (typeof salary === 'number') {
        return { min: salary };
    }

    if (!salary || typeof salary !== 'object') {
        return salary;
    }

    const normalized = { ...salary };

    if (normalized.min !== undefined && normalized.min !== null && normalized.min !== '') {
        normalized.min = Number(normalized.min);
    }

    if (normalized.max !== undefined && normalized.max !== null && normalized.max !== '') {
        normalized.max = Number(normalized.max);
    }

    return normalized;
};

const getTopClassification = (result) => {
    const top = Array.isArray(result) ? result[0] : result;
    return {
        label: top?.labels?.[0] || top?.label || "Other",
        score: top?.scores?.[0] ?? top?.score ?? null,
    };
};

const normalizeEmbedding = (embedding) => {
    if (Array.isArray(embedding?.[0])) {
        return embedding[0];
    }
    return embedding;
};

const getGeneratedText = (result) => {
    if (typeof result === "string") return result;
    if (Array.isArray(result)) return result[0]?.generated_text || "";
    return result?.generated_text || "";
};

const buildCoverLetterFallback = ({ user, job, bio, skills, requirements }) => {
    const applicantName = user?.name || "Applicant";
    const company = job.company || "your company";
    const title = job.title || "this role";
    const skillList = (user?.skills || []).slice(0, 6);
    const requirementList = (job.requirements || []).slice(0, 4);

    const skillSentence = skillList.length
        ? `My experience with ${skillList.join(", ")} aligns well with the needs of this position.`
        : "My background has prepared me to contribute quickly and keep learning in a professional engineering environment.";

    const requirementSentence = requirementList.length
        ? `I was especially drawn to the role's focus on ${requirementList.join(", ")}, and I would be glad to bring practical, detail-oriented work to those areas.`
        : "I am interested in contributing to the team's goals with clear communication, ownership, and steady execution.";

    return [
        `Dear ${company} Hiring Team,`,
        "",
        `I am excited to apply for the ${title} role at ${company}. ${bio || `${applicantName}'s profile shows a strong interest in this field.`}`,
        "",
        `${skillSentence} ${requirementSentence}`,
        "",
        `Thank you for considering my application. I would welcome the opportunity to discuss how my background can support ${company}'s work.`,
        "",
        `Sincerely,`,
        applicantName,
    ].join("\n");
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
        const studentEmbedding = normalizeEmbedding(await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: studentText,
        }));

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

    const { title, company, description, requirements, location, type, salary, totalSlots, applicationDeadline, requiresCv, requiresCoverLetter, experience, requiredEducation, requiredEducationField, workplaceType, perks, hiringStages, screeningQuestions } = req.body;
    const normalizedLocation = normalizeLocation(location);
    const normalizedSalary = normalizeSalary(salary);

    if (!title || !company || !description || !requirements || requirements.length === 0 || !location || !type) {
        return next(createError(400, "Please provide all required fields"));
    }

    if (
        normalizedSalary &&
        Number.isFinite(normalizedSalary.min) &&
        Number.isFinite(normalizedSalary.max) &&
        normalizedSalary.min > normalizedSalary.max
    ) {
        return next(createError(400, 'salary.min cannot be greater than salary.max'));
    }

    if (experience && experience.minYears < 0) {
        return next(createError(400, 'experience.minYears cannot be negative'));
    }

    if (screeningQuestions) {
        const validationError = validateScreeningQuestions(screeningQuestions);
        if (validationError) return next(createError(400, validationError));
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
        const classification = getTopClassification(result);
        category = classification.label;
        aiCategoryConfidence = classification.score;
    } catch (hfError) {
        console.error("AI classification failed:", hfError.message);
    }

    let embeddings = [];
    try {
        const jobText = `${title} ${requirements.join(' ')}`;
        const embedding = normalizeEmbedding(await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2',
            inputs: jobText,
        }));
        embeddings = embedding;
    } catch (embErr) {
        console.error('Embedding computation failed:', embErr.message);
    }

    const job = await JobPost.create({
        title, company, description, requirements, location: normalizedLocation, type, salary: normalizedSalary, totalSlots, applicationDeadline, requiresCv, requiresCoverLetter, experience, requiredEducation, requiredEducationField, workplaceType, perks, hiringStages, screeningQuestions, category, aiCategoryConfidence, embeddings, createdBy: req.user._id,
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

    const alreadySaved = user.savedJobs.some((id) => id.toString() === jobId.toString());

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

    const fields = ["title", "company", "description", "requirements", "location", "type", "salary", "totalSlots", "status", "applicationDeadline", "requiresCv", "requiresCoverLetter", "experience", "requiredEducation", "requiredEducationField", "workplaceType", "perks", "hiringStages", "screeningQuestions"];

    for (const field of fields) {
        if (req.body[field] !== undefined) {
            job[field] = field === "location"
                ? normalizeLocation(req.body[field])
                : field === "salary"
                    ? normalizeSalary(req.body[field])
                    : req.body[field];
        }
    }

    if (
        job.salary &&
        Number.isFinite(job.salary.min) &&
        Number.isFinite(job.salary.max) &&
        job.salary.min > job.salary.max
    ) {
        return next(createError(400, 'salary.min cannot be greater than salary.max'));
    }

    if (req.body.experience && req.body.experience.minYears < 0) {
        return next(createError(400, 'experience.minYears cannot be negative'));
    }

    if (req.body.screeningQuestions) {
        const validationError = validateScreeningQuestions(req.body.screeningQuestions);
        if (validationError) return next(createError(400, validationError));
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
            const classification = getTopClassification(result);
            job.category = classification.label;
            job.aiCategoryConfidence = classification.score;
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
            const embedding = normalizeEmbedding(await hf.featureExtraction({
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                inputs: jobText,
            }));
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

// POST /api/v1/jobs/:id/cover-letter-suggestion   (jobSeeker only)
// BONUS: Uses HuggingFace text2text-generation to draft a cover letter
const generateCoverLetterSuggestion = asyncHandler(async (req, res, next) => {
    const job = await JobPost.findById(req.params.id).select("title company description requirements");
    if (!job) return next(createError(404, "Job not found"));

    const User = require("../user/User");
    const user = await User.findById(req.user._id).select("name bio skills");

    const bio = user?.bio?.trim();
    const skills = (user?.skills || []).join(", ");
    const requirements = (job.requirements || []).join(", ");

    if (!bio && !skills) {
        return next(createError(400, "Please update your profile with a bio or extracted skills first."));
    }

    const prompt =
        `Write a professional cover letter for the following applicant applying to the job below.\n\n` +
        `Applicant name: ${user?.name || "Applicant"}\n` +
        `Applicant bio: ${bio || "(not provided)"}\n` +
        `Applicant skills: ${skills || "(not provided)"}\n\n` +
        `Job title: ${job.title}\n` +
        `Company: ${job.company}\n` +
        `Job description: ${job.description?.slice(0, 400) || ""}\n` +
        `Required skills: ${requirements || "(not listed)"}\n\n` +
        `Cover letter:`;

    try {
        const result = await hf.textGeneration({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            inputs: prompt,
            parameters: { max_new_tokens: 350, temperature: 0.7, return_full_text: false },
        });

        const suggestion = getGeneratedText(result).trim();
        if (suggestion) {
            return res.status(200).json({ success: true, suggestion, generatedBy: "huggingface" });
        }

        const fallback = buildCoverLetterFallback({ user, job, bio, skills, requirements });
        return res.status(200).json({ success: true, suggestion: fallback, generatedBy: "template" });
    } catch (err) {
        console.error("HF cover letter error:", err?.message);
        const fallback = buildCoverLetterFallback({ user, job, bio, skills, requirements });
        return res.status(200).json({ success: true, suggestion: fallback, generatedBy: "template" });
    }
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
    generateCoverLetterSuggestion,
};
