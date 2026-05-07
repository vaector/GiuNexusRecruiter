const User = require("../features/user/User");
const { isBlacklisted } = require('./tokenBlacklist');

const jwt = require("jsonwebtoken");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError(401, "Not authorised, token missing or invalid"));
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next(createError(401, "Not authorised, token missing or invalid"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (isBlacklisted(decoded.jti)) {
      return next(createError(401, "Token has been invalidated"));
    }

    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return next(createError(401, "Not authorised, token missing or invalid"));
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return next(createError(401, "Not authorised, token missing or invalid"));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(createError(401, "Not authorised, token missing or invalid"));
    }
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createError(403, "Forbidden: insufficient role"));
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};