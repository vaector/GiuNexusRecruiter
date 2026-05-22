const asyncHandler = require("../../middleware/asyncHandler");
const User = require("./User");
const JobPost = require("../jobPost/jobPost");
const Application = require("../application/Application");
const AuditLog = require("../auditLog/auditLog");
const Notification = require("../notification/notification");
const Report = require("../reports/reports");
const { AuditAction, NotificationType, UserStatus } = require("../../enums");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

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
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return next(createError(404, "User not found"));
  res.status(200).json({ success: true, user });
});

// PATCH /api/v1/users/:id/status
exports.updateUserStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = Object.values(UserStatus);
  if (!status || !allowedStatuses.includes(status)) {
    return next(createError(400, `Status must be one of: ${allowedStatuses.join(", ")}`));
  }
  const existingUser = await User.findById(req.params.id).select("status role");
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select("-password");
  if (!user) return next(createError(404, "User not found"));

  const isRecruiter = existingUser?.role === "recruiter";

  if (status === UserStatus.APPROVED) {
    if (isRecruiter) {
      await AuditLog.record({
        actor: req.user,
        action: AuditAction.RECRUITER_APPROVED,
        targetModel: "User",
        targetId: user._id,
        metadata: { from: existingUser?.status, to: status, role: existingUser?.role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    }
    await Notification.send({
      recipient: user._id,
      type: NotificationType.ACCOUNT_APPROVED,
      title: "Account Update",
      message: isRecruiter
        ? "Your recruiter account has been approved"
        : "Your account has been approved",
    });
  }

  if (status === UserStatus.REJECTED) {
    if (isRecruiter) {
      await AuditLog.record({
        actor: req.user,
        action: AuditAction.RECRUITER_REJECTED,
        targetModel: "User",
        targetId: user._id,
        metadata: { from: existingUser?.status, to: status, role: existingUser?.role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    } else {
      await AuditLog.record({
        actor: req.user,
        action: AuditAction.USER_BANNED,
        targetModel: "User",
        targetId: user._id,
        metadata: { from: existingUser?.status, to: status, role: existingUser?.role },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });
    }
    await Notification.send({
      recipient: user._id,
      type: NotificationType.ACCOUNT_REJECTED,
      title: "Account Update",
      message: isRecruiter
        ? "Your recruiter account has been rejected"
        : "Your account has been rejected",
    });
    await Report.updateMany(
      { targetModel: 'User', targetId: user._id, status: 'open' },
      { status: 'actioned', adminNote: 'Resolved via account rejection', reviewedBy: req.user._id, reviewedAt: new Date() }
    );
  }
  res.status(200).json({ success: true, user });
});

// DELETE /api/v1/users/:id
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(createError(404, "User not found"));
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

  await Report.updateMany(
    { targetModel: 'User', targetId: user._id, status: 'open' },
    { status: 'actioned', adminNote: 'Resolved via user deletion', reviewedBy: req.user._id, reviewedAt: new Date() }
  );

  await AuditLog.record({
    actor: req.user,
    action: AuditAction.USER_DELETED,
    targetModel: "User",
    targetId: user._id,
    metadata: { name: user.name, email: user.email, role: user.role, status: user.status },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });
  res.status(200).json({ success: true, message: "User deleted" });
});
