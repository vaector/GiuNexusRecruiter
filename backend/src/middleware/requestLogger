const RequestLog = require('../features/requestLog/RequestLog');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    try {
      await RequestLog.create({
        route: req.route ? `${req.baseUrl}${req.route.path}` : req.path,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTimeMs: Date.now() - start,
        user: req.user?._id || null,
        userRole: req.user?.role || null,
        ipAddress: req.ip,
        isError: res.statusCode >= 400,
      });
    } catch (err) {
      console.error('[RequestLogger] Failed to write log:', err.message);
    }
  });

  next();
};

module.exports = requestLogger;