const JobPost = require("./JobPost");

// GET /api/v1/jobs
const getAllJobs = async (req, res) => {
    try {
        const { category, location, type, page = 1, limit = 10 } = req.query;

        const filter = { status: "open" };
        if (category) filter.category = category;
        if (location) filter.location = location;
        if (type) filter.type = type;

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