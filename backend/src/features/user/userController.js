// TODO: user controller functions
const User = require("./User");

// ─────────────────────────────────────────────
// GET /api/v1/users
// Admin only — paginated list of all users
// Optional filters: ?role=recruiter&status=pending&page=1&limit=20
// ─────────────────────────────────────────────
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;

    // Build a dynamic filter object — only add keys if they were provided
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    // Count total matching documents (for pagination info)
    const total = await User.countDocuments(filter);

    // Fetch users — never return the password field
    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      users,
    });
  } catch (err) {
    next(err); // passes to your centralised error middleware
  }
};

// ─────────────────────────────────────────────
// GET /api/v1/users/:id
// Admin only — get a single user by their MongoDB _id
// ─────────────────────────────────────────────
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PATCH /api/v1/users/:id/status
// Admin only — set a user's status to approved / rejected / pending
// Body: { "status": "approved" }
// ─────────────────────────────────────────────
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate the value before touching the database
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
      { new: true, runValidators: true } // new:true returns the updated document
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/v1/users/:id
// Admin only — permanently delete a user account
// ─────────────────────────────────────────────
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted",
    });
  } catch (err) {
    next(err);
  }
};
