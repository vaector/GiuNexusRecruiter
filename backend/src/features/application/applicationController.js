const Application = require("./Application");

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

    res.status(200).json({
      success: true,
      total,
      page,
      applications,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAllApplications };
