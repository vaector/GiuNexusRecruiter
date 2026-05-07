const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Server error";

  // Mongoose validation error (e.g. enum mismatch, required field missing)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 404;
    message = "Resource not found";
  }

  // MongoDB duplicate key (e.g. unique index violation)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate field value";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
