const mongoose = require("mongoose");

const asyncHandler = require("../../middleware/asyncHandler");
const Application = require("../application/Application");
const JobPost = require("../job-posts/JobPost");
const User = require("../user/User");
const Message = require("./Message");

const SAFE_USER_FIELDS = "name email role";
const SAFE_JOB_FIELDS = "title company status";
const MAX_MESSAGE_LENGTH = 2000;

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sameId = (left, right) =>
  left && right && left.toString() === right.toString();

const getId = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  return value.toString();
};

const cleanUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const cleanJob = (job) => {
  if (!job) return null;
  return {
    _id: job._id,
    title: job.title,
    company: job.company,
    status: job.status,
  };
};

const cleanLatestMessage = (message) => ({
  _id: message._id,
  job: getId(message.job),
  sender: cleanUser(message.sender),
  recipient: cleanUser(message.recipient),
  body: message.body,
  readAt: message.readAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const normalizeBody = (body) => {
  if (typeof body !== "string") return "";
  return body.trim();
};

const hasConversationRefs = (message) =>
  Boolean(message && message.job && message.sender && message.recipient);

const requireValidObjectId = (value, message) => {
  if (!isValidObjectId(value)) {
    return createError(400, message);
  }

  return null;
};

const findJob = async (jobId) =>
  JobPost.findById(jobId).select(`${SAFE_JOB_FIELDS} createdBy`);

const findJobSeekerApplication = async (jobId, userId) =>
  Application.findOne({ job: jobId, user: userId });

const requireJobSeekerApplicant = async (jobId, userId) => {
  const [recipient, application] = await Promise.all([
    User.findOne({ _id: userId, role: "jobSeeker" }).select("_id role"),
    findJobSeekerApplication(jobId, userId),
  ]);

  if (!recipient || !application) return null;
  return application;
};

const buildConversations = (messages, currentUserId, isAllowedThread) => {
  const conversationsByKey = new Map();

  messages.forEach((message) => {
    if (!hasConversationRefs(message)) return;

    const jobId = getId(message.job);
    const senderId = getId(message.sender);
    const recipientId = getId(message.recipient);

    if (!jobId || !senderId || !recipientId) return;

    const otherUser =
      senderId === currentUserId ? message.recipient : message.sender;
    const otherUserId = getId(otherUser);

    if (!otherUserId || !isAllowedThread(message, otherUserId)) return;

    const key = `${jobId}:${otherUserId}`;
    const isUnreadForCurrentUser =
      recipientId === currentUserId && senderId === otherUserId && !message.readAt;

    if (!conversationsByKey.has(key)) {
      conversationsByKey.set(key, {
        job: cleanJob(message.job),
        otherUser: cleanUser(otherUser),
        latestMessage: cleanLatestMessage(message),
        latestMessageAt: message.createdAt,
        unreadCount: isUnreadForCurrentUser ? 1 : 0,
      });
      return;
    }

    if (isUnreadForCurrentUser) {
      const conversation = conversationsByKey.get(key);
      conversation.unreadCount += 1;
    }
  });

  return Array.from(conversationsByKey.values()).sort(
    (left, right) => new Date(right.latestMessageAt) - new Date(left.latestMessageAt)
  );
};

// POST /api/v1/conversations/:jobId/messages
const sendMessage = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const invalidJobId = requireValidObjectId(jobId, "Invalid job id");
  if (invalidJobId) return next(invalidJobId);

  const job = await findJob(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const trimmedBody = normalizeBody(req.body && req.body.body);
  if (!trimmedBody) {
    return next(createError(400, "Message body is required"));
  }
  if (trimmedBody.length > MAX_MESSAGE_LENGTH) {
    return next(
      createError(400, `Message body cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
    );
  }

  let recipient;

  if (req.user.role === "recruiter") {
    if (!sameId(job.createdBy, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorised to message applicants for this job",
      });
    }

    const recipientId = req.body && req.body.recipientId;
    if (!recipientId) {
      return next(createError(400, "recipientId is required"));
    }

    const invalidRecipientId = requireValidObjectId(
      recipientId,
      "Invalid recipient id"
    );
    if (invalidRecipientId) return next(invalidRecipientId);

    const application = await requireJobSeekerApplicant(jobId, recipientId);
    if (!application) {
      return res.status(403).json({
        success: false,
        message: "Recipient has not applied to this job",
      });
    }
    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot message a rejected applicant",
      });
    }

    recipient = recipientId;
  }

  if (req.user.role === "jobSeeker") {
    const application = await findJobSeekerApplication(jobId, req.user._id);
    if (!application) {
      return res.status(403).json({
        success: false,
        message: "You cannot message about a job you have not applied to",
      });
    }
    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Cannot message after application rejection",
      });
    }

    recipient = job.createdBy;
  }

  const message = await Message.create({
    job: jobId,
    sender: req.user._id,
    recipient,
    body: trimmedBody,
  });

  await message.populate([
    { path: "sender", select: SAFE_USER_FIELDS },
    { path: "recipient", select: SAFE_USER_FIELDS },
  ]);

  return res.status(201).json({ success: true, message });
});

// GET /api/v1/conversations/:jobId/messages
const getMessages = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const invalidJobId = requireValidObjectId(jobId, "Invalid job id");
  if (invalidJobId) return next(invalidJobId);

  const job = await findJob(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  let otherUserId;

  if (req.user.role === "recruiter") {
    if (!sameId(job.createdBy, req.user._id)) {
      return next(createError(403, "Not authorised to view messages for this job"));
    }

    const applicantId = req.query.with;
    if (!applicantId) {
      return next(createError(400, "with query parameter is required"));
    }

    const invalidApplicantId = requireValidObjectId(
      applicantId,
      "Invalid applicant id"
    );
    if (invalidApplicantId) return next(invalidApplicantId);

    const application = await requireJobSeekerApplicant(jobId, applicantId);
    if (!application) {
      return next(createError(403, "Applicant has not applied to this job"));
    }

    otherUserId = applicantId;
  }

  if (req.user.role === "jobSeeker") {
    const application = await findJobSeekerApplication(jobId, req.user._id);
    if (!application) {
      return next(
        createError(403, "You cannot view messages for a job you have not applied to")
      );
    }

    otherUserId = job.createdBy;
  }

  const currentUserId = req.user._id;

  await Message.updateMany(
    {
      job: jobId,
      sender: otherUserId,
      recipient: currentUserId,
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  const messages = await Message.find({
    job: jobId,
    $or: [
      { sender: currentUserId, recipient: otherUserId },
      { sender: otherUserId, recipient: currentUserId },
    ],
  })
    .populate("sender", SAFE_USER_FIELDS)
    .sort({ createdAt: 1 });

  return res.status(200).json({ success: true, messages });
});

// GET /api/v1/conversations
const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();
  let messages = [];
  let conversations = [];

  if (req.user.role === "recruiter") {
    const jobs = await JobPost.find({ createdBy: req.user._id })
      .select(SAFE_JOB_FIELDS)
      .lean();
    const jobIds = jobs.map((job) => job._id);

    if (!jobIds.length) {
      return res.status(200).json({ success: true, conversations: [] });
    }

    const applications = await Application.find({ job: { $in: jobIds } })
      .select("job user")
      .lean();
    const applicantByJob = new Set(
      applications.map((application) => `${application.job}:${application.user}`)
    );

    messages = await Message.find({
      job: { $in: jobIds },
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .populate("job", SAFE_JOB_FIELDS)
      .populate("sender", SAFE_USER_FIELDS)
      .populate("recipient", SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    conversations = buildConversations(messages, currentUserId, (message, otherUserId) => {
      const jobId = getId(message.job);
      const senderRole = message.sender && message.sender.role;
      const recipientRole = message.recipient && message.recipient.role;

      return (
        (senderRole === "jobSeeker" || recipientRole === "jobSeeker") &&
        applicantByJob.has(`${jobId}:${otherUserId}`)
      );
    });
  }

  if (req.user.role === "jobSeeker") {
    const applications = await Application.find({ user: req.user._id })
      .select("job")
      .lean();
    const appliedJobIds = applications.map((application) => application.job);

    if (!appliedJobIds.length) {
      return res.status(200).json({ success: true, conversations: [] });
    }

    messages = await Message.find({
      job: { $in: appliedJobIds },
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .populate("job", `${SAFE_JOB_FIELDS} createdBy`)
      .populate("sender", SAFE_USER_FIELDS)
      .populate("recipient", SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    conversations = buildConversations(messages, currentUserId, (message, otherUserId) =>
      sameId(message.job && message.job.createdBy, otherUserId)
    );
  }

  return res.status(200).json({ success: true, conversations });
});

module.exports = {
  getConversations,
  sendMessage,
  getMessages,
};
