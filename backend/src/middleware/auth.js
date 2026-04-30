const User = require("../features/user/User");

const jwt = require("jsonwebtoken");

const unauthorized = (res) =>
  res.status(401).json({
    success: false,
    message: "Not authorised, token missing or invalid",
  });

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized(res);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return unauthorized(res);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return unauthorized(res);
    }

    const user = await User.findById(userId);

    if (!user) {
      return unauthorized(res);
    }

    req.user = user;
    next();
  } catch (_error) {
    return unauthorized(res);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient role",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};