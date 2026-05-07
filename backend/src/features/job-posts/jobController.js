const hf = require("../../services/hfService");
const JobPost = require("./JobPost");
const User = require("../user/User");

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
const getRecommendedJobs = async (req, res, next) => {
    try {
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
                .sort((a, b) => b.score - a.score);

            return res.status(200).json({ success: true, jobs });
        } catch (hfError) {
            console.error("HuggingFace recommendations failed:", hfError.message);
            return res.status(200).json({ success: true, jobs: openJobs });
        }
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/jobs
const getAllJobs = async (req, res, next) => {
    try {
        const { category, location, type, status, keyword } = req.query;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

        const filter = {};

        if (status) filter.status = status;
        else filter.status = "open";

        if (category) filter.category = category;
        if (location) filter.location = location;
        if (type) filter.type = type;

        if (keyword) filter.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { description: { $regex: keyword, $options: "i" } }
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
        next(error);
    }
};

// GET /api/v1/jobs/my-jobs
const getMyJobs = async (req, res, next) => {
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
        next(error);
    }
};

// GET /api/v1/jobs/:id
const getJobById = async (req, res, next) => {
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
        next(error);
    }
};

// POST /api/v1/jobs
const createJob = async (req, res, next) => {
    try {
        if (req.user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Wait for admin approval before posting jobs."
            });
        }

        const { title, company, description, requirements, location, type, salary, totalSlots } = req.body;

        if (!title || !company || !description || !requirements || requirements.length === 0 || !location || !type) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        let category = "Other";

        try {
            const result = await hf.zeroShotClassification({
                model: "facebook/bart-large-mnli",
                inputs: [description],
                parameters: {
                    candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"]
                }
            });
            category = result[0].labels[0];
        } catch (error) {
            console.error("AI classification failed: ", error.message);
        }

        const job = await JobPost.create({
            title, company, description, requirements, location, type, salary, totalSlots, category, createdBy: req.user._id
        });

        return res.status(201).json({
            success: true,
            job
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/v1/jobs/:id
const updateJob = async (req, res, next) => {
    try {
        if (req.user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Wait for admin approval before posting jobs."
            });
        }

        const job = await JobPost.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorised to edit this job"
            });
        }

        const fields = ["title", "company", "description", "requirements", "location", "type", "salary", "totalSlots", "status"];

        for (const field of fields) {
            if (req.body[field] !== undefined) {
                job[field] = req.body[field];
            }
        }

        const descriptionChanged = Object.prototype.hasOwnProperty.call(req.body, "description") &&
            req.body.description !== job.description;

        if (descriptionChanged) {

            try {
                const result = await hf.zeroShotClassification({
                    model: "facebook/bart-large-mnli",
                    inputs: [req.body.description],
                    parameters: {
                        candidate_labels: ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"]
                    }
                });
                job.category = result[0].labels[0];
            } catch (error) {
                console.error("AI classification failed: ", error.message);
            }
        }

        await job.save();
        return res.status(200).json({
            success: true,
            job
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        next(error);
    }
};

// DELETE /api/v1/jobs/:id
const deleteJob = async (req, res, next) => {
    try {
        if (req.user.role === "recruiter" && req.user.status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Your account is pending approval. Wait for admin approval before managing jobs."
            });
        }

        const job = await JobPost.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Not authorised to delete this job"
            });
        }

        await job.deleteOne();
        return res.status(200).json({
            success: true,
            message: "Job deleted"
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        next(error);
    }
};

module.exports = { getAllJobs, getMyJobs, getJobById, createJob, updateJob, deleteJob, getRecommendedJobs };