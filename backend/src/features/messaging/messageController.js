const mongoose = require("mongoose");

const asyncHandler = require("../../middleware/asyncHandler");
const Application = require("../application/Application");
const JobPost = require("../job-posts/JobPost");
const User = require("../user/User");
const Message = require("./Message");

const SAFE_USER_FIELDS = "name email role";
const SAFE_JOB_FIELDS = "title company status";
const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_MESSAGES_PAGE = 1;
const DEFAULT_MESSAGES_LIMIT = 30;
const MAX_MESSAGES_LIMIT = 100;

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const normalizeObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(value);

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

const parsePositiveInteger = (value, fallback) => {
  if (Array.isArray(value)) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;

  return parsed;
};

const getMessagePagination = (query) => {
  const page = parsePositiveInteger(query.page, DEFAULT_MESSAGES_PAGE);
  const rawLimit = parsePositiveInteger(query.limit, DEFAULT_MESSAGES_LIMIT);
  const limit = Math.min(rawLimit, MAX_MESSAGES_LIMIT);

  return { page, limit };
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

const listConversationSummaries = async ({ currentUserId, jobIds }) => {
  if (!Array.isArray(jobIds) || !jobIds.length) return [];
  const normalizedCurrentUserId = normalizeObjectId(currentUserId);

  return Message.aggregate([
    {
      $match: {
        job: { $in: jobIds },
        $or: [
          { sender: normalizedCurrentUserId },
          { recipient: normalizedCurrentUserId },
        ],
      },
    },
    {
      $addFields: {
        otherUser: {
          $cond: [
            { $eq: ["$sender", normalizedCurrentUserId] },
            "$recipient",
            "$sender",
          ],
        },
        unreadForCurrentUser: {
          $cond: [
            {
              $and: [
                { $eq: ["$recipient", normalizedCurrentUserId] },
                { $eq: ["$readAt", null] },
              ],
            },
            1,
            0,
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { job: "$job", otherUser: "$otherUser" },
        latestMessageId: { $first: "$_id" },
        latestMessageAt: { $first: "$createdAt" },
        unreadCount: { $sum: "$unreadForCurrentUser" },
      },
    },
    { $sort: { latestMessageAt: -1 } },
  ]);
};

const hydrateConversations = async ({
  summaries,
  currentUserId,
  isAllowedThread,
}) => {
  if (!Array.isArray(summaries) || !summaries.length) return [];

  const latestMessageIds = summaries.map((summary) => summary.latestMessageId);
  const latestMessages = await Message.find({ _id: { $in: latestMessageIds } })
    .populate([
      { path: "job", select: `${SAFE_JOB_FIELDS} createdBy` },
      { path: "sender", select: SAFE_USER_FIELDS },
      { path: "recipient", select: SAFE_USER_FIELDS },
    ])
    .lean();

  const latestById = new Map(
    latestMessages.map((message) => [getId(message._id), message])
  );

  return summaries.reduce((acc, summary) => {
    const message = latestById.get(getId(summary.latestMessageId));
    if (!hasConversationRefs(message)) return acc;

    const senderId = getId(message.sender);
    const otherUser =
      senderId === currentUserId ? message.recipient : message.sender;
    const otherUserId = getId(otherUser);

    if (!otherUserId || !isAllowedThread(message, otherUserId)) return acc;

    acc.push({
      job: cleanJob(message.job),
      otherUser: cleanUser(otherUser),
      latestMessage: cleanLatestMessage(message),
      latestMessageAt: summary.latestMessageAt,
      unreadCount: summary.unreadCount,
    });

    return acc;
  }, []);
};

const requireJobSeekerApplicant = async (jobId, userId) => {
  const normalizedUserId = normalizeObjectId(userId);

  const [recipient, application] = await Promise.all([
    User.findById(normalizedUserId).select("_id role"),
    findJobSeekerApplication(jobId, normalizedUserId),
  ]);

  if (!recipient || recipient.role !== "jobSeeker" || !application) return null;
  return application;
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

    const recipientObjectId = normalizeObjectId(recipientId);
    const application = await requireJobSeekerApplicant(jobId, recipientObjectId);
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

    recipient = recipientObjectId;
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

    const applicantObjectId = normalizeObjectId(applicantId);
    const application = await requireJobSeekerApplicant(jobId, applicantObjectId);
    if (!application) {
      return next(createError(403, "Applicant has not applied to this job"));
    }

    otherUserId = applicantObjectId;
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
  const { page, limit } = getMessagePagination(req.query);
  const messageFilter = {
    job: jobId,
    $or: [
      { sender: currentUserId, recipient: otherUserId },
      { sender: otherUserId, recipient: currentUserId },
    ],
  };

  const total = await Message.countDocuments(messageFilter);

  if (total === 0) {
    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: 0,
      hasMore: false,
      messages: [],
    });
  }

  const totalPages = Math.ceil(total / limit);

  if (page > totalPages) {
    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      hasMore: false,
      messages: [],
    });
  }

  const skip = Math.max(total - page * limit, 0);
  const pageEnd = total - (page - 1) * limit;
  const adjustedLimit = pageEnd - skip;

  const messages = await Message.find(messageFilter)
    .populate("sender", SAFE_USER_FIELDS)
    .populate("recipient", SAFE_USER_FIELDS)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(adjustedLimit);

  await Message.updateMany(
    {
      job: jobId,
      sender: otherUserId,
      recipient: currentUserId,
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  );

  return res.status(200).json({
    success: true,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    messages,
  });
});

// GET /api/v1/conversations
const getConversations = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();
  const currentUserObjectId = normalizeObjectId(req.user._id);
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

    const summaries = await listConversationSummaries({
      currentUserId: currentUserObjectId,
      jobIds,
    });

    conversations = await hydrateConversations({
      summaries,
      currentUserId,
      isAllowedThread: (message, otherUserId) => {
        const jobId = getId(message.job);
        const senderRole = message.sender && message.sender.role;
        const recipientRole = message.recipient && message.recipient.role;

        return (
          (senderRole === "jobSeeker" || recipientRole === "jobSeeker") &&
          applicantByJob.has(`${jobId}:${otherUserId}`)
        );
      },
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

    const summaries = await listConversationSummaries({
      currentUserId: currentUserObjectId,
      jobIds: appliedJobIds,
    });

    conversations = await hydrateConversations({
      summaries,
      currentUserId,
      isAllowedThread: (message, otherUserId) =>
        sameId(message.job && message.job.createdBy, otherUserId),
    });
  }

  return res.status(200).json({ success: true, conversations });
});

module.exports = {
  getConversations,
  sendMessage,
  getMessages,
};
