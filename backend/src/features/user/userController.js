const asyncHandler = require("../../middleware/asyncHandler");
const User = require("./User");
const JobPost = require("../job-posts/JobPost");
const Application = require("../application/Application");

// GET /api/v1/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({ success: true, total, page, users });
});

// GET /api/v1/users/:id
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, user });
});

// PATCH /api/v1/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ["approved", "rejected", "pending"];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${allowedStatuses.join(", ")}`,
    });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({ success: true, user });
});

// DELETE /api/v1/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.role === "recruiter") {
    const jobIds = await JobPost.find({ createdBy: user._id }).distinct("_id");
    await Promise.all([
      Application.deleteMany({ job: { $in: jobIds } }),
      JobPost.deleteMany({ createdBy: user._id }),
    ]);
  } else if (user.role === "jobSeeker") {
    await Application.deleteMany({ user: user._id });
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: "User deleted" });
});
