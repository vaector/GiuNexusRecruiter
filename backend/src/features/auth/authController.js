const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../user/User");
const sendEmail = require("../../services/emailService");
const asyncHandler = require("../../middleware/asyncHandler");
const { addToBlacklist } = require('../../middleware/tokenBlacklist');
const AuditLog = require("../auditLog/auditLog");
const { AuditAction, Role, UserStatus } = require("../../enums");
const { generateSecret, verifyTotp, printQrToConsole } = require("../../middleware/totpService");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw createError(500, "JWT_SECRET is not configured");
  if (!process.env.JWT_EXPIRE) throw createError(500, "JWT_EXPIRE is not configured");
  return jwt.sign(
    { _id: user._id, role: user.role, jti: crypto.randomUUID() },
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
    status: role === Role.RECRUITER ? UserStatus.PENDING : UserStatus.APPROVED,
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

  if (user.status === UserStatus.REJECTED) {
    return next(createError(403, "Your account has been rejected"));
  }

  if (user.mfaEnabled) {
    if (user.mfaMethod === 'email_otp') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
      user.otpExpire = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        to: user.email,
        subject: 'Your GIU Nexus verification code',
        text: `Your login verification code is: ${otp}\n\nExpires in 10 minutes.`,
      });

      return res.status(200).json({
        success: true,
        mfaRequired: true,
        mfaMethod: 'email_otp',
        userId: user._id,
      });
    }

    if (user.mfaMethod === 'totp') {
      return res.status(200).json({
        success: true,
        mfaRequired: true,
        mfaMethod: 'totp',
        userId: user._id,
      });
    }
  }

  return authResponse(res, 200, user);
});

// POST /api/v1/auth/logout
const logout = (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);

  if (decoded?.jti) {
    addToBlacklist(decoded.jti);
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

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

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otpCode = crypto.createHash("sha256").update(otp).digest("hex");
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: "Your GIU Nexus verification code",
      text: `Your OTP is: ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
    });
  } catch (err) {
    console.error("Email send failed:", err);
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json(response);
});

// POST /api/v1/auth/verify-otp — password reset OTP verification
const verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(createError(400, "Email and OTP are required"));
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email: normalizeEmail(email),
    otpCode: hashedOtp,
    otpExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(createError(400, "OTP is invalid or has expired"));
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "OTP verified",
    resetToken,
  });
});

// POST /api/v1/auth/verify-mfa — MFA login verification
const verifyMfaOtp = asyncHandler(async (req, res, next) => {
  const { userId, otp, method } = req.body;

  if (!userId || !otp || !method) {
    return next(createError(400, "userId, otp, and method are required"));
  }

  if (method === 'email_otp') {
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({
      _id: userId,
      otpCode: hashedOtp,
      otpExpire: { $gt: Date.now() },
    });
    if (!user) return next(createError(400, 'Invalid or expired OTP'));
    user.otpCode = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return authResponse(res, 200, user);
  }

  if (method === 'totp') {
    const user = await User.findById(userId);
    if (!user) return next(createError(404, 'User not found'));
    if (!verifyTotp(user.totpSecret, otp)) return next(createError(400, 'Invalid authenticator code'));
    return authResponse(res, 200, user);
  }

  return next(createError(400, 'Invalid MFA method'));
});

// POST /api/v1/auth/setup-totp — private
const setupTotp = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(createError(404, 'User not found'));
  const secret = generateSecret();
  user.totpSecret = secret;
  await user.save({ validateBeforeSave: false });
  printQrToConsole(secret, user.email);
  return res.status(200).json({
    success: true,
    secret,
    message: 'Scan the QR URL printed in server console with your authenticator app',
  });
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

  await AuditLog.record({
    actor: { _id: user._id, role: user.role },
    action: AuditAction.USER_PASSWORD_RESET,
    targetModel: "User",
    targetId: user._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  return authResponse(res, 200, user);
});

module.exports = { register, login, logout, forgotPassword, verifyOtp, verifyMfaOtp, resetPassword, setupTotp };