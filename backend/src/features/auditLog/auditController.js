const asyncHandler = require("../../middleware/asyncHandler");
const AuditLog = require('./AuditLog');
const User = require("../user/User");

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// GET /api/v1/admin/audit-logs
const getAuditLogs = asyncHandler(async (req, res, next) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    //   if (req.query.actor)       filter.actor = req.query.actor;
    if (req.query.actorRole) filter.actorRole = req.query.actorRole;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.targetModel) filter.targetModel = req.query.targetModel;
    if (req.query.actorName) {
        const matchingUsers = await User.find(
            { name: { $regex: req.query.actorName, $options: 'i' } },
            '_id'
        );
        filter.actor = { $in: matchingUsers.map(u => u._id) };
    }
    if (req.query.from || req.query.to) {
        filter.performedAt = {};
        if (req.query.from) {
            const d = new Date(req.query.from);
            if (isNaN(d)) return next(createError(400, 'Invalid from date'));
            filter.performedAt.$gte = d;
        }
        if (req.query.to) {
            const d = new Date(req.query.to);
            if (isNaN(d)) return next(createError(400, 'Invalid to date'));
            filter.performedAt.$lte = d;
        }
    }

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .populate('actor', 'name email role')
            .sort({ performedAt: -1 })
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), logs });
});

module.exports = { getAuditLogs };