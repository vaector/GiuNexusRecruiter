const asyncHandler = require("../../middleware/asyncHandler");
const RequestLog = require('./RequestLog');

// GET /api/v1/admin/request-logs
const getRequestLogs = asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.route) filter.route = { $regex: req.query.route, $options: 'i' };
    if (req.query.method) filter.method = req.query.method.toUpperCase();
    if (req.query.statusCode) filter.statusCode = parseInt(req.query.statusCode);
    if (req.query.isError) filter.isError = req.query.isError === 'true';
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.from || req.query.to) {
        filter.performedAt = {};
        if (req.query.from) {
            const d = new Date(req.query.from);
            if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid from date' });
            filter.performedAt.$gte = d;
        }
        if (req.query.to) {
            const d = new Date(req.query.to);
            if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid to date' });
            filter.performedAt.$lte = d;
        }
    }

    const [logs, total] = await Promise.all([
        RequestLog.find(filter)
            .populate('user', 'name email role')
            .sort({ performedAt: -1 })
            .skip(skip)
            .limit(limit),
        RequestLog.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), logs });
});

// GET /api/v1/admin/request-logs/stats
const getRequestLogStats = asyncHandler(async (req, res) => {
    const dateFilter = {};
    if (req.query.from || req.query.to) {
        dateFilter.performedAt = {};
        if (req.query.from) {
            const d = new Date(req.query.from);
            if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid from date' });
            dateFilter.performedAt.$gte = d;
        }
        if (req.query.to) {
            const d = new Date(req.query.to);
            if (isNaN(d)) return res.status(400).json({ success: false, message: 'Invalid to date' });
            dateFilter.performedAt.$lte = d;
        }
    }

    const matchStage = Object.keys(dateFilter).length ? { $match: dateFilter } : null;
    const pipeline = (stages) => matchStage ? [matchStage, ...stages] : stages;

    const [byMethod, byStatusCode, slowestRoutes, errorRates, aiCallCount] = await Promise.all([
        RequestLog.aggregate(pipeline([
            { $group: { _id: '$method', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ])),
        RequestLog.aggregate(pipeline([
            { $group: { _id: '$statusCode', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ])),
        RequestLog.aggregate(pipeline([
            { $group: { _id: '$route', avgResponseTime: { $avg: '$responseTimeMs' }, count: { $sum: 1 } } },
            { $sort: { avgResponseTime: -1 } },
            { $limit: 10 },
        ])),
        RequestLog.aggregate(pipeline([
            { $group: { _id: '$route', total: { $sum: 1 }, errors: { $sum: { $cond: ['$isError', 1, 0] } } } },
            { $addFields: { errorRate: { $divide: ['$errors', '$total'] } } },
            { $sort: { errorRate: -1 } },
            { $limit: 10 },
        ])),
        RequestLog.countDocuments({ aiServiceCalled: true, ...dateFilter }),
    ]);

    res.status(200).json({
        success: true,
        stats: { byMethod, byStatusCode, slowestRoutes, errorRates, aiCallCount },
    });
});

module.exports = { getRequestLogs, getRequestLogStats };