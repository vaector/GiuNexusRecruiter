const asyncHandler = require("../../middleware/asyncHandler");
const hf = require("../../services/hfService");
const Application = require("./Application");
const Document = require("../document/document");
const JobPost = require("../jobPost/jobPost");
const User = require("../user/User");
const AuditLog = require("../auditLog/auditLog");
const Notification = require("../notification/notification");
const Referral = require("../referrals/Referral");
const { AuditAction, NotificationType, HiringStage, ApplicationStatus, JobStatus } = require("../../enums");
const cosineSimilarity = require("../../utils/cosineSimilarity");

const ALLOWED_APPLICATION_STATUSES = Object.values(ApplicationStatus);

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// GET /api/v1/applications
const listAllApplications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [total, applications] = await Promise.all([
    Application.countDocuments(),
    Application.find()
      .populate("user", "name email")
      .populate("job", "title company")
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  res.status(200).json({ success: true, total, page, applications });
});

// GET /api/v1/jobs/:jobId/applicants
const getJobApplicants = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await JobPost.findById(jobId);
  if (!job) return next(createError(404, "Job not found"));

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorised to view applicants for this job"));
  }

  const applications = await Application.find({ job: jobId })
    .populate("user", "name email skills profilePicture")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

// GET /api/v1/applications/my
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id })
    .populate("job", "title company type status location category")
    .sort({ appliedAt: -1 });

  return res.status(200).json({ success: true, applications });
});

// GET /api/v1/applications/:id
const getApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate("user", "name email skills profilePicture")
    .populate("job", "title company type status location category salary");
  if (!application) return next(createError(404, "Application not found"));

  const isRecruiterOwner = application.job?.createdBy?.toString() === req.user._id.toString();
  const isApplicant = application.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isRecruiterOwner && !isApplicant && !isAdmin) {
    return next(createError(403, "Not authorised to view this application"));
  }

  return res.status(200).json({ success: true, application });
});

// PATCH /api/v1/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [...ALLOWED_APPLICATION_STATUSES, ...Object.values(HiringStage)];
  if (!validStatuses.includes(status)) {
    return next(createError(400, "Invalid status or hiring stage"));
  }

  const application = await Application.findById(id).populate("job", "createdBy");
  if (!application) return next(createError(404, "Application not found"));
  if (!application.job) return next(createError(404, "Related job not found"));

  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorised to update this application"));
  }

  const previousStatus = application.status;
  
  // If the status corresponds to a HiringStage but not an ApplicationStatus, keep the 
  // 'application.status' as shortlisted, but update the stageHistory.
  if (ALLOWED_APPLICATION_STATUSES.includes(status)) {
    application.status = status;
  } else if (Object.values(HiringStage).includes(status)) {
    application.status = ApplicationStatus.SHORTLISTED;
  }

  let stageToSet;
  if (status === ApplicationStatus.SHORTLISTED) {
    stageToSet = HiringStage.SCREENING;
  } else if (status === ApplicationStatus.REJECTED) {
    stageToSet = HiringStage.REJECTED;
  } else if (Object.values(HiringStage).includes(status)) {
    // If the input was actually a HiringStage like 'interview', 'offer'
    stageToSet = status;
  } else {
    stageToSet = status;
  }

  application.stageHistory.push({
    stage: stageToSet,
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  if (req.body.recruiterNotes !== undefined) {
    application.recruiterNotes = req.body.recruiterNotes;
  }

  await application.save();

  const statsInc = {};
  if (previousStatus === ApplicationStatus.PENDING) statsInc['applicationStats.totalPending'] = -1;
  if (status === ApplicationStatus.SHORTLISTED) statsInc['applicationStats.totalShortlisted'] = 1;
  else if (status === ApplicationStatus.REJECTED) statsInc['applicationStats.totalRejected'] = 1;
  if (Object.keys(statsInc).length > 0) {
    await User.findByIdAndUpdate(application.user, { $inc: statsInc });
  }

  const updatedUser = await User.findById(application.user);
  const { totalApplied, totalShortlisted, totalRejected } = updatedUser.applicationStats;
  const responseRate = totalApplied > 0 ? (totalShortlisted + totalRejected) / totalApplied : 0;
  await User.findByIdAndUpdate(application.user, {
    $set: { 'applicationStats.responseRate': responseRate }
  });

  if (status === ApplicationStatus.SHORTLISTED || status === ApplicationStatus.REJECTED) {
    await AuditLog.record({
      actor: req.user,
      action: status === ApplicationStatus.SHORTLISTED ? AuditAction.APPLICATION_SHORTLISTED : AuditAction.APPLICATION_REJECTED,
      targetModel: "Application",
      targetId: application._id,
      metadata: { from: previousStatus, to: status },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });
  }

  const updatedApplication = await Application.findById(application._id)
    .populate("user", "name email skills profilePicture")
    .populate("job", "title company type status");

  await Notification.send({
    recipient: updatedApplication.user._id,
    type: NotificationType.APPLICATION_STATUS_CHANGED,
    title: "Application Update",
    message: `Your application for ${updatedApplication.job.title} at ${updatedApplication.job.company} has been ${status}`,
    relatedJob: updatedApplication.job._id,
    relatedApplication: updatedApplication._id,
  });

  if (status === ApplicationStatus.SHORTLISTED || status === ApplicationStatus.REJECTED) {
    const referral = await Referral.findOne({
      referred: updatedApplication.user._id,
      job: updatedApplication.job._id,
    });
    if (referral) {
      await Referral.updateOne(
        { _id: referral._id },
        { status: status === ApplicationStatus.SHORTLISTED ? "accepted" : "rejected" }
      );
      await Notification.send({
        recipient: referral.referrer,
        type: NotificationType.REFERRAL_APPLIED,
        title: status === ApplicationStatus.SHORTLISTED ? "Referral Accepted" : "Referral Update",
        message: status === ApplicationStatus.SHORTLISTED
          ? `Your referral for ${updatedApplication.job.title} was accepted — ${updatedApplication.user.name} was shortlisted`
          : `Your referral for ${updatedApplication.job.title} was not successful — ${updatedApplication.user.name} was rejected`,
        relatedJob: updatedApplication.job._id,
      });
    }
  }

  return res.status(200).json({ success: true, application: updatedApplication });
});

// POST /api/v1/jobs/:jobId/apply — jobSeeker only
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, screeningAnswers } = req.body;

    const [job, user] = await Promise.all([
      JobPost.findById(jobId),
      User.findById(req.user._id).select("skills"),
    ]);

    if (!job) {
      return next(createError(404, "Job not found"));
    }

    if (job.status !== JobStatus.OPEN) {
      return next(createError(400, "Cannot apply to a closed job"));
    }

    if (job.requiresCv) {
      const hasCv = await Document.findOne({ uploadedBy: req.user._id, type: 'cv' });
      if (!hasCv) return next(createError(400, 'This job requires a CV. Please upload your CV first via POST /api/v1/documents'));
    }

    if (job.requiresCoverLetter && !req.body.coverLetter) {
      return next(createError(400, 'This job requires a cover letter. Please include coverLetter in your application'));
    }

    // TODO M3: Verify applicant meets minimum experience requirement via profile experience field

    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      return next(createError(400, "You have already applied to this job"));
    }

    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      const answers = Array.isArray(screeningAnswers) ? screeningAnswers : [];
      for (const sq of job.screeningQuestions) {
        if (!sq.required) continue; // ← skip optional questions
        const match = answers.find((a) => a.question === sq.question);
        if (!match || !match.answer || (typeof match.answer === 'string' && !match.answer.trim())) {
          return next(createError(400, `Please answer required question: "${sq.question}"`));
        }
      }
    }

    let aiMatchScore = null;
    if (job.embeddings && job.embeddings.length > 0 && user.skills && user.skills.length > 0) {
      try {
        const studentText = user.skills.join(', ');
        const studentEmbedding = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: studentText,
        });
        const vec = Array.isArray(studentEmbedding[0]) ? studentEmbedding[0] : studentEmbedding;
        aiMatchScore = Math.max(0, Math.round(cosineSimilarity(vec, job.embeddings) * 100));
      } catch (err) {
        console.error('aiMatchScore computation failed:', err.message);
      }
    }

    let application;
    try {
      application = await Application.create({
        user: req.user._id,
        job: jobId,
        ...(coverLetter && { coverLetter }),
        ...(aiMatchScore !== null && { aiMatchScore }),
        screeningAnswers: Array.isArray(screeningAnswers) ? screeningAnswers : [],
        stageHistory: [{ stage: HiringStage.PENDING, updatedBy: req.user._id }],
      });
    } catch (err) {
      if (err.code === 11000) {
        return next(createError(400, "You have already applied to this job"));
      }
      return next(err);
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'applicationStats.totalApplied': 1,
        'applicationStats.totalPending': 1,
      },
      $set: { 'applicationStats.lastAppliedAt': new Date() },
    });

    await AuditLog.record({
      actor: req.user,
      action: AuditAction.APPLICATION_CREATED,
      targetModel: "Application",
      targetId: application._id,
      metadata: { jobId, jobTitle: job.title },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    await Notification.send({
      recipient: job.createdBy,
      type: NotificationType.NEW_APPLICANT,
      title: "New Applicant",
      message: `${req.user.name} applied to your job posting: ${job.title}`,
      relatedJob: job._id,
      relatedApplication: application._id,
    });

    return res.status(201).json({ success: true, application });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/applications/:id/withdraw — jobSeeker only
const withdrawApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findOne({ _id: req.params.id, user: req.user._id });
  if (!application) return next(createError(404, "Application not found"));

  const job = await JobPost.findById(application.job).select("title createdBy");

  await application.deleteOne();

  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      'applicationStats.totalWithdrawn': 1,
      'applicationStats.totalPending': -1,
    },
  });

  await AuditLog.record({
    actor: req.user,
    action: AuditAction.APPLICATION_WITHDRAWN,
    targetModel: "Application",
    targetId: application._id,
    metadata: { withdrawnAt: new Date(), jobTitle: job?.title },
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
  });

  await Notification.send({
    recipient: job?.createdBy,
    type: NotificationType.APPLICATION_WITHDRAWN,
    title: "Application Withdrawn",
    message: `${req.user.name} withdrew their application for ${job?.title}`,
    relatedJob: application.job,
    relatedApplication: application._id,
  });

  return res.status(200).json({ success: true, message: "Application withdrawn" });
});

// PATCH /api/v1/applications/:id/notes — recruiter only
const updateRecruiterNotes = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { recruiterNotes } = req.body;

  const application = await Application.findById(id).populate("job", "createdBy");
  if (!application) return next(createError(404, "Application not found"));
  if (!application.job) return next(createError(404, "Related job not found"));

  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, "Not authorised to update notes for this application"));
  }

  application.recruiterNotes = recruiterNotes;
  await application.save();

  const updatedApplication = await Application.findById(application._id)
    .populate("user", "name email skills profilePicture")
    .populate("job", "title company");

  return res.status(200).json({ success: true, application: updatedApplication });
});

module.exports = {
  listAllApplications,
  getApplication,
  getJobApplicants,
  getMyApplications,
  updateApplicationStatus,
  applyToJob,
  withdrawApplication,
  updateRecruiterNotes,
};
