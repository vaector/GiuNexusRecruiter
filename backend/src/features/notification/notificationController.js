const asyncHandler = require("../../middleware/asyncHandler");
const Notification = require("./notification");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// GET /api/v1/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { recipient: req.user._id };
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json({ success: true, total, unreadCount, page, pages: Math.ceil(total / limit), notifications });
});

// PATCH /api/v1/notifications/:id/read
const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(createError(404, 'Notification not found'));
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  res.status(200).json({ success: true, notification });
});

// PATCH /api/v1/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
