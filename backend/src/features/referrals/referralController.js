const asyncHandler = require("../../middleware/asyncHandler");
const Referral = require("./Referral");
const JobPost = require("../jobPost/jobPost");
const User = require("../user/User");
const Notification = require("../notification/notification");
const { NotificationType, ReferralStatus, JobStatus } = require("../../enums");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/v1/referrals/my-code
const getMyCode = asyncHandler(async (req, res, next) => {
  if (!req.user.referralCode) {
    let code;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateCode();
      exists = await User.findOne({ referralCode: code });
      attempts++;
    }
    if (attempts === 10) return next(createError(500, 'Could not generate unique referral code'));
    req.user.referralCode = code;
    await req.user.save({ validateBeforeSave: false });
  }

  return res.status(200).json({ success: true, code: req.user.referralCode });
});

// POST /api/v1/referrals/request
const requestReferral = asyncHandler(async (req, res, next) => {
  const { referrerCode, jobId, message } = req.body;

  if (!referrerCode || !jobId) {
    return next(createError(400, 'referrerCode and jobId are required'));
  }

  const referrer = await User.findOne({ referralCode: referrerCode.toUpperCase() });
  if (!referrer) {
    return next(createError(404, 'Invalid referral code'));
  }

  if (referrer._id.equals(req.user._id)) {
    return next(createError(400, 'Cannot request a referral from yourself'));
  }

  const job = await JobPost.findById(jobId);
  if (!job) {
    return next(createError(404, 'Job not found'));
  }

  if (job.status !== JobStatus.OPEN) {
    return next(createError(400, 'Job is not open for applications'));
  }

  const Application = require('../application/Application');
  const application = await Application.findOne({ user: req.user._id, job: jobId });
  if (!application) {
    return next(createError(400, 'You must apply to the job before requesting a referral'));
  }

  const existing = await Referral.findOne({ referred: req.user._id, job: jobId });
  if (existing) {
    return next(createError(400, 'You already have a referral for this job'));
  }

  const pendingCount = await Referral.countDocuments({
    referred: req.user._id,
    referrer: referrer._id,
    status: 'pending',
  });
  if (pendingCount >= 3) {
    return next(createError(400, 'You have too many pending referral requests with this user'));
  }

  const referral = await Referral.create({
    referrer: referrer._id,
    referred: req.user._id,
    job: jobId,
    code: referrerCode.toUpperCase(),
    status: ReferralStatus.PENDING,
    message,
  });

  await Notification.send({
    recipient: referrer._id,
    type: NotificationType.REFERRAL_REQUESTED,
    title: 'Referral Request',
    message: `${req.user.name} is requesting a referral from you for ${job.title} at ${job.company}`,
    relatedJob: job._id,
  });

  return res.status(201).json({ success: true, referral });
});

// PATCH /api/v1/referrals/:id/respond
const respondToReferral = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return next(createError(400, "status must be 'accepted' or 'rejected'"));
  }

  const referral = await Referral.findById(req.params.id).populate('job', 'title company');
  if (!referral) {
    return next(createError(404, 'Referral not found'));
  }

  if (!referral.referrer.equals(req.user._id)) {
    return next(createError(403, 'Only the referrer can respond to this request'));
  }

  if (referral.status !== ReferralStatus.PENDING) {
    return next(createError(400, 'This referral has already been responded to'));
  }

  referral.status = status;
  referral.respondedAt = new Date();
  await referral.save();

  await Notification.send({
    recipient: referral.referred,
    type: NotificationType.REFERRAL_RESPONDED,
    title: status === 'accepted' ? 'Referral Accepted' : 'Referral Rejected',
    message: status === 'accepted'
      ? `Your referral request for ${referral.job.title} was accepted`
      : `Your referral request for ${referral.job.title} was declined`,
    relatedJob: referral.job._id,
  });

  return res.status(200).json({ success: true, referral });
});

// GET /api/v1/referrals/sent — job seeker sees their sent requests
const getSentReferrals = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, referrals] = await Promise.all([
    Referral.countDocuments({ referred: req.user._id }),
    Referral.find({ referred: req.user._id })
      .populate('referrer', 'name email')
      .populate('job', 'title company')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const pages = Math.ceil(total / limit);

  return res.status(200).json({ success: true, total, page, pages, referrals });
});

// GET /api/v1/referrals/received — referrer sees incoming requests
const getReceivedReferrals = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, referrals] = await Promise.all([
    Referral.countDocuments({ referrer: req.user._id }),
    Referral.find({ referrer: req.user._id })
      .populate('referred', 'name email')
      .populate('job', 'title company')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const pages = Math.ceil(total / limit);

  return res.status(200).json({ success: true, total, page, pages, referrals });
});

// GET /api/v1/referrals — admin only
const listAllReferrals = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, referrals] = await Promise.all([
    Referral.countDocuments(),
    Referral.find()
      .populate('referrer', 'name email')
      .populate('referred', 'name email')
      .populate('job', 'title company')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const pages = Math.ceil(total / limit);

  return res.status(200).json({ success: true, total, page, pages, referrals });
});

// PATCH /api/v1/referrals/:id/status — admin only
const updateReferralStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status || !Object.values(ReferralStatus).includes(status)) {
    return next(createError(400, `status must be one of: ${Object.values(ReferralStatus).join(', ')}`));
  }

  const referral = await Referral.findById(req.params.id);
  if (!referral) {
    return next(createError(404, 'Referral not found'));
  }

  referral.status = status;
  await referral.save();

  return res.status(200).json({ success: true, referral });
});

module.exports = {
  getMyCode,
  requestReferral,
  respondToReferral,
  getSentReferrals,
  getReceivedReferrals,
  listAllReferrals,
  updateReferralStatus,
};
