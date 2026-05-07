const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../user/User");
const sendEmail = require("../../services/emailService");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw createError(500, "JWT_SECRET is not configured");
  if (!process.env.JWT_EXPIRE) throw createError(500, "JWT_EXPIRE is not configured");
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

const authResponse = (res, statusCode, user) => {
  const token = signToken(user);
  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      skills: user.skills,
      profilePicture: user.profilePicture,
    },
  });
};

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = "jobSeeker" } = req.body;

  if (!name || typeof email !== "string" || !email.trim() || !password) {
    return next(createError(400, "Name, email, and password are required"));
  }
  if (password.length < 6) {
    return next(createError(400, "Password must be at least 6 characters"));
  }
  if (!["jobSeeker", "recruiter"].includes(role)) {
    return next(createError(400, "Role must be either jobSeeker or recruiter"));
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return next(createError(400, "Email already in use"));
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
    status: role === "recruiter" ? "pending" : "approved",
  });

  return authResponse(res, 201, user);
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email.trim() || !password) {
    return next(createError(400, "Email and password are required"));
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user || !(await user.comparePassword(password))) {
    return next(createError(401, "Invalid email or password"));
  }

  if (user.status === "rejected") {
    return next(createError(403, "Your account has been rejected"));
  }

  return authResponse(res, 200, user);
});

// POST /api/v1/auth/logout
const logout = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Always return 200 to prevent email enumeration
  const response = {
    success: true,
    message: "Password reset email sent",
  };

  if (typeof email !== "string" || !email.trim()) {
    return res.status(200).json(response);
  }

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    return res.status(200).json(response);
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Token",
      text: `Use this token to reset your password: ${resetToken}`,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json(response);
});

// PATCH /api/v1/auth/reset-password/:token
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return next(createError(400, "Password must be at least 6 characters"));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(createError(400, "Token is invalid or has expired"));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return authResponse(res, 200, user);
});

module.exports = { register, login, logout, forgotPassword, resetPassword };