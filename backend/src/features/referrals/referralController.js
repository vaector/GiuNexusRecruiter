const asyncHandler = require("../../middleware/asyncHandler");
const Referral = require("./Referral");
const JobPost = require("../job-posts/JobPost");
const User = require("../user/User");

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
const getMyCode = asyncHandler(async (req, res) => {
  if (!req.user.referralCode) {
    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await User.findOne({ referralCode: code });
    }
    req.user.referralCode = code;
    await req.user.save({ validateBeforeSave: false });
  }

  return res.status(200).json({ success: true, code: req.user.referralCode });
});

// POST /api/v1/referrals
const recordReferral = asyncHandler(async (req, res, next) => {
  const { code, jobId } = req.body;

  if (!code || !jobId) {
    return next(createError(400, "code and jobId are required"));
  }

  const referrer = await User.findOne({ referralCode: code.toUpperCase() });
  if (!referrer) {
    return next(createError(404, "Invalid referral code"));
  }

  if (referrer._id.equals(req.user._id)) {
    return next(createError(400, "Cannot use your own referral code"));
  }

  const job = await JobPost.findById(jobId);
  if (!job) {
    return next(createError(404, "Job not found"));
  }

  const Application = require("../application/Application");
  const application = await Application.findOne({ user: req.user._id, job: jobId });
  if (!application) {
    return next(createError(400, "You must apply to the job before recording a referral"));
  }

  const existing = await Referral.findOne({ referred: req.user._id, job: jobId });
  if (existing) {
    return next(createError(400, "Referral already recorded for this job"));
  }

  const referral = await Referral.create({
    referrer: referrer._id,
    referred: req.user._id,
    job: jobId,
    code: code.toUpperCase(),
    status: "pending",
  });

  return res.status(201).json({ success: true, referral });
});

// GET /api/v1/referrals/sent
const getSentReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find({ referrer: req.user._id })
    .populate("referred", "name email")
    .populate("job", "title company")
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, referrals });
});

// GET /api/v1/referrals — admin only
const listAllReferrals = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, referrals] = await Promise.all([
    Referral.countDocuments(),
    Referral.find()
      .populate("referrer", "name email")
      .populate("referred", "name email")
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({ success: true, total, page, referrals });
});

module.exports = { getMyCode, recordReferral, getSentReferrals, listAllReferrals };
