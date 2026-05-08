const asyncHandler = require("../../middleware/asyncHandler");
const Report = require('./reports');
const { ReportReason, ReportStatus } = require("../../enums");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// POST /api/v1/reports
const createReport = asyncHandler(async (req, res, next) => {
  const { targetModel, targetId, reason, details } = req.body;

  if (!targetModel || !targetId || !reason) {
    return next(createError(400, 'targetModel, targetId, and reason are required'));
  }

  if (!Object.values(ReportReason).includes(reason)) {
    return next(createError(400, `reason must be one of: ${Object.values(ReportReason).join(', ')}`))
  }
  
  if (!["JobPost", "User"].includes(targetModel)) {
    return next(createError(400, 'targetModel must be JobPost or User'))
  }

  const existing = await Report.findOne({
    reporter: req.user._id,
    targetModel,
    targetId,
  });

  if (existing) {
    return next(createError(400, 'You have already reported this'));
  }

  const report = await Report.create({
    reporter: req.user._id,
    targetModel,
    targetId,
    reason,
    details,
  });

  res.status(201).json({ success: true, report });
});

// GET /api/v1/reports
const getReports = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status)      filter.status = req.query.status;
  if (req.query.targetModel) filter.targetModel = req.query.targetModel;
  if (req.query.reason)      filter.reason = req.query.reason;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter', 'name email role')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), reports });
});

// PATCH /api/v1/reports/:id/review
const reviewReport = asyncHandler(async (req, res, next) => {
  const { status, adminNote } = req.body;

  if (!status) {
    return next(createError(400, 'status is required'));
  }

  if (!Object.values(ReportStatus).includes(status)) {
    return next(createError(400, `status must be one of: ${Object.values(ReportStatus).join(', ')}`))
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(createError(404, 'Report not found'));
  }

  if (report.status !== 'open') {
    return next(createError(400, 'Report has already been reviewed'));
  }

  report.status = status;
  report.adminNote = adminNote || null;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  await report.save();

  res.status(200).json({ success: true, report });
});

module.exports = { createReport, getReports, reviewReport };
