const errorHandler = (err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server error",
  });
};

module.exports = errorHandler;
