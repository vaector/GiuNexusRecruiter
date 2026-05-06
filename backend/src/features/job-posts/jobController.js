// Jobs: Browse & Detail (GET /jobs, GET /jobs/:id, GET /jobs/my-jobs)
const JobPost = require("./JobPost");

// GET /api/v1/jobs
const getAllJobs = async (req, res) => {
    try {
        const { category, location, type, status, keyword, page = 1, limit = 10 } = req.query;

        // Build filter dynamically
        const filter = {};

        // FIX 1: Allow status as a query param instead of hardcoding "open"
        // Defaults to "open" but admins/recruiters can override with ?status=closed
        if (status) filter.status = status;
        else filter.status = "open";

        if (category) filter.category = category;
        if (location) filter.location = location;
        if (type) filter.type = type;

        // FIX 2: Add keyword search across title and description
        // Example: ?keyword=react will match jobs with "react" in title or description
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
            data: jobs,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/jobs/my-jobs
const getMyJobs = async (req, res) => {
    try {
        const jobs = await JobPost.find({ createdBy: req.user._id }).sort({
            createdAt: -1,
        });

        res.status(200).json({
            success: true,
            total: jobs.length,
            data: jobs,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/v1/jobs/:id
const getJobById = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id).populate(
            "createdBy",
            "name email"
        );

        if (!job) {
            return res
                .status(404)
                .json({ success: false, message: "Job not found" });
        }

        res.status(200).json({ success: true, data: job });
    } 
    catch (error) {
        if (error.name === "CastError") {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getAllJobs, getMyJobs, getJobById };