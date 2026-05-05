const jwt = require("jsonwebtoken");
const User = require("../user/User");

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

const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = "jobSeeker" } = req.body;

  if (!name || typeof email !== "string" || !email.trim() || !password) {
    return next(createError(400, "Name, email, and password are required"));
  }

  if (!["jobSeeker", "recruiter"].includes(role)) {
    return next(createError(400, "Role must be either jobSeeker or recruiter"));
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return next(createError(409, "User with this email already exists"));
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

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email.trim() || !password) {
    return next(createError(400, "Email and password are required"));
  }

  const user = await User.findOne({ email: normalizeEmail(email) });

  if (!user || !(await user.comparePassword(password))) {
    return next(createError(401, "Invalid email or password"));
  }

  return authResponse(res, 200, user);
});

module.exports = { register, login };
