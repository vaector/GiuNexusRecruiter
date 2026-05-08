const mongoose = require("mongoose");

const asyncHandler = require("../../middleware/asyncHandler");
const { NotificationType } = require("../../enums");
const Application = require("../application/Application");
const JobPost = require("../jobPost/jobPost");
const Notification = require("../notification/notification");
const User = require("../user/User");
const Message = require("./message");

const SAFE_USER_FIELDS = "name email role";
const SAFE_JOB_FIELDS = "title company status";
const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_MESSAGES_PAGE = 1;
const DEFAULT_MESSAGES_LIMIT = 30;
const MAX_MESSAGES_LIMIT = 100;
const DEFAULT_CONVERSATIONS_LIMIT = 20;
const MAX_CONVERSATIONS_LIMIT = 50;

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

const getConversationPagination = (query) => {
  const page = parsePositiveInteger(query.page, 1);
  const rawLimit = parsePositiveInteger(query.limit, DEFAULT_CONVERSATIONS_LIMIT);
  const limit = Math.min(rawLimit, MAX_CONVERSATIONS_LIMIT);

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

// currentUserId must be a Mongoose ObjectId (i.e. req.user._id)
const listConversationSummaries = async ({ currentUserId, jobIds }) => {
  if (!Array.isArray(jobIds) || !jobIds.length) return [];

  return Message.aggregate([
    {
      $match: {
        job: { $in: jobIds },
        $or: [{ sender: currentUserId }, { recipient: currentUserId }],
      },
    },
    {
      $addFields: {
        otherUser: {
          $cond: [
            { $eq: ["$sender", currentUserId] },
            "$recipient",
            "$sender",
          ],
        },
        unreadForCurrentUser: {
          $cond: [
            {
              $and: [
                { $eq: ["$recipient", currentUserId] },
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

// userId must already be validated; returns the application or null
const requireJobSeekerApplicant = async (jobId, userId) => {
  const [recipient, application] = await Promise.all([
    User.findById(userId).select("_id role"),
    findJobSeekerApplication(jobId, userId),
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
    return next(createError(404, "Job not found"));
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
      return next(createError(403, "Not authorised to message applicants for this job"));
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

    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
    const application = await requireJobSeekerApplicant(jobId, recipientObjectId);
    if (!application) {
      return next(createError(403, "Recipient has not applied to this job"));
    }
    if (application.status === "rejected") {
      return next(createError(400, "Cannot message a rejected applicant"));
    }

    recipient = recipientObjectId;
  }

  if (req.user.role === "jobSeeker") {
    const application = await findJobSeekerApplication(jobId, req.user._id);
    if (!application) {
      return next(createError(403, "You cannot message about a job you have not applied to"));
    }
    if (application.status === "rejected") {
      return next(createError(400, "Cannot message after application rejection"));
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

  await Notification.send({
    recipient,
    type: NotificationType.NEW_MESSAGE,
    title: "New Message",
    message: `${req.user.name} sent you a message about ${job.title}`,
    relatedJob: job._id,
  });

  return res.status(201).json({ success: true, message });
});

// GET /api/v1/conversations/:jobId/messages
const getMessages = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;
  const invalidJobId = requireValidObjectId(jobId, "Invalid job id");
  if (invalidJobId) return next(invalidJobId);

  const job = await findJob(jobId);
  if (!job) {
    return next(createError(404, "Job not found"));
  }

  // Admin: view any thread by specifying sender + recipient query params
  if (req.user.role === "admin") {
    const senderId = req.query.sender;
    const recipientId = req.query.recipient;

    if (!senderId || !recipientId) {
      return next(createError(400, "sender and recipient query parameters are required"));
    }

    const invalidSenderId = requireValidObjectId(senderId, "Invalid sender id");
    if (invalidSenderId) return next(invalidSenderId);

    const invalidRecipientId = requireValidObjectId(recipientId, "Invalid recipient id");
    if (invalidRecipientId) return next(invalidRecipientId);

    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    const messageFilter = {
      job: jobId,
      $or: [
        { sender: senderObjectId, recipient: recipientObjectId },
        { sender: recipientObjectId, recipient: senderObjectId },
      ],
    };

    const { page, limit } = getMessagePagination(req.query);
    const total = await Message.countDocuments(messageFilter);

    if (total === 0) {
      return res.status(200).json({ success: true, page, limit, total, totalPages: 0, hasMore: false, messages: [] });
    }

    const totalPages = Math.ceil(total / limit);
    if (page > totalPages) {
      return res.status(200).json({ success: true, page, limit, total, totalPages, hasMore: false, messages: [] });
    }

    const skip = Math.max(total - page * limit, 0);
    const adjustedLimit = total - (page - 1) * limit - skip;

    const messages = await Message.find(messageFilter)
      .populate("sender", SAFE_USER_FIELDS)
      .populate("recipient", SAFE_USER_FIELDS)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(adjustedLimit);

    return res.status(200).json({ success: true, page, limit, total, totalPages, hasMore: page < totalPages, messages });
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

    const applicantObjectId = new mongoose.Types.ObjectId(applicantId);
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
const getConversations = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id.toString();
  const { page, limit } = getConversationPagination(req.query);
  const skip = (page - 1) * limit;

  let allSummaries = [];
  let isAllowedThread;

  if (req.user.role === "recruiter") {
    const jobs = await JobPost.find({ createdBy: req.user._id })
      .select(SAFE_JOB_FIELDS)
      .lean();
    const jobIds = jobs.map((job) => job._id);

    if (!jobIds.length) {
      return res.status(200).json({ success: true, page, limit, total: 0, totalPages: 0, hasMore: false, conversations: [] });
    }

    const applications = await Application.find({ job: { $in: jobIds } })
      .select("job user")
      .lean();
    const applicantByJob = new Set(
      applications.map((application) => `${application.job}:${application.user}`)
    );

    allSummaries = await listConversationSummaries({
      currentUserId: req.user._id,
      jobIds,
    });

    isAllowedThread = (message, otherUserId) => {
      const jobId = getId(message.job);
      const senderRole = message.sender && message.sender.role;
      const recipientRole = message.recipient && message.recipient.role;

      return (
        (senderRole === "jobSeeker" || recipientRole === "jobSeeker") &&
        applicantByJob.has(`${jobId}:${otherUserId}`)
      );
    };
  }

  if (req.user.role === "jobSeeker") {
    const applications = await Application.find({ user: req.user._id })
      .select("job")
      .lean();
    const appliedJobIds = applications.map((application) => application.job);

    if (!appliedJobIds.length) {
      return res.status(200).json({ success: true, page, limit, total: 0, totalPages: 0, hasMore: false, conversations: [] });
    }

    allSummaries = await listConversationSummaries({
      currentUserId: req.user._id,
      jobIds: appliedJobIds,
    });

    isAllowedThread = (message, otherUserId) =>
      sameId(message.job && message.job.createdBy, otherUserId);
  }

  const total = allSummaries.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedSummaries = allSummaries.slice(skip, skip + limit);

  const conversations = await hydrateConversations({
    summaries: paginatedSummaries,
    currentUserId,
    isAllowedThread,
  });

  return res.status(200).json({
    success: true,
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    conversations,
  });
});

// GET /api/v1/conversations/admin
const getAdminConversations = asyncHandler(async (req, res) => {
  const { page, limit } = getConversationPagination(req.query);
  const skip = (page - 1) * limit;

  const result = await Message.aggregate([
    {
      $addFields: {
        userPair: {
          $cond: [
            { $lt: ["$sender", "$recipient"] },
            { u1: "$sender", u2: "$recipient" },
            { u1: "$recipient", u2: "$sender" },
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { job: "$job", userPair: "$userPair" },
        latestMessageId: { $first: "$_id" },
        latestMessageAt: { $first: "$createdAt" },
      },
    },
    { $sort: { latestMessageAt: -1 } },
    {
      $facet: {
        total: [{ $count: "count" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const total = result[0]?.total[0]?.count ?? 0;
  const summaries = result[0]?.data ?? [];

  const latestMessageIds = summaries.map((s) => s.latestMessageId);
  const latestMessages = await Message.find({ _id: { $in: latestMessageIds } })
    .populate([
      { path: "job", select: SAFE_JOB_FIELDS },
      { path: "sender", select: SAFE_USER_FIELDS },
      { path: "recipient", select: SAFE_USER_FIELDS },
    ])
    .lean();

  const latestById = new Map(
    latestMessages.map((m) => [getId(m._id), m])
  );

  const conversations = summaries.reduce((acc, summary) => {
    const message = latestById.get(getId(summary.latestMessageId));
    if (!hasConversationRefs(message)) return acc;

    acc.push({
      job: cleanJob(message.job),
      sender: cleanUser(message.sender),
      recipient: cleanUser(message.recipient),
      latestMessage: cleanLatestMessage(message),
      latestMessageAt: summary.latestMessageAt,
    });

    return acc;
  }, []);

  return res.status(200).json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
    conversations,
  });
});

module.exports = {
  getConversations,
  getAdminConversations,
  sendMessage,
  getMessages,
};
