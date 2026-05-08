const express = require("express");

const {
  getConversations,
  getAdminConversations,
  getMessages,
  sendMessage,
} = require("./messageController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Conversations and messages between recruiters and job seekers
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MessageUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [recruiter, jobSeeker]
 *
 *     MessageJob:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         company:
 *           type: string
 *         status:
 *           type: string
 *           enum: [open, closed]
 *
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         job:
 *           type: string
 *           description: Job ID
 *         sender:
 *           $ref: '#/components/schemas/MessageUser'
 *         recipient:
 *           $ref: '#/components/schemas/MessageUser'
 *         body:
 *           type: string
 *           maxLength: 2000
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ConversationSummary:
 *       type: object
 *       properties:
 *         job:
 *           $ref: '#/components/schemas/MessageJob'
 *         otherUser:
 *           $ref: '#/components/schemas/MessageUser'
 *         latestMessage:
 *           $ref: '#/components/schemas/Message'
 *         latestMessageAt:
 *           type: string
 *           format: date-time
 *         unreadCount:
 *           type: integer
 *           minimum: 0
 *
 *     AdminConversationSummary:
 *       type: object
 *       properties:
 *         job:
 *           $ref: '#/components/schemas/MessageJob'
 *         sender:
 *           $ref: '#/components/schemas/MessageUser'
 *         recipient:
 *           $ref: '#/components/schemas/MessageUser'
 *         latestMessage:
 *           $ref: '#/components/schemas/Message'
 *         latestMessageAt:
 *           type: string
 *           format: date-time
 *
 *     PaginatedConversations:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         hasMore:
 *           type: boolean
 *         conversations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ConversationSummary'
 *
 *     PaginatedMessages:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         hasMore:
 *           type: boolean
 *         messages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Message'
 */

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: Get all conversations for the current user
 *     description: >
 *       Returns a paginated list of conversations. Each entry shows the other participant,
 *       the associated job, the latest message, and the unread count.
 *       Recruiters see threads with applicants for their own jobs.
 *       Job seekers see threads with recruiters for jobs they applied to.
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Conversations per page (max 50)
 *     responses:
 *       200:
 *         description: Paginated list of conversations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedConversations'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin accounts cannot use this endpoint
 */
router.get("/", protect, authorize("recruiter", "jobSeeker"), getConversations);

/**
 * @swagger
 * /conversations/admin:
 *   get:
 *     summary: List all platform conversations (admin only)
 *     description: >
 *       Returns a paginated list of every unique conversation thread on the platform,
 *       sorted by most recent message. Each entry shows both participants, the job,
 *       and the latest message. Messages are not marked as read by this endpoint.
 *     tags: [Messaging]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Conversations per page (max 50)
 *     responses:
 *       200:
 *         description: Paginated list of all conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 hasMore:
 *                   type: boolean
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AdminConversationSummary'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin role required
 */
// /admin must be declared before /:jobId routes so Express doesn't treat "admin" as a jobId
router.get("/admin", protect, authorize("admin"), getAdminConversations);

/**
 * @swagger
 * /conversations/{jobId}/messages:
 *   post:
 *     summary: Send a message in a conversation thread
 *     description: >
 *       Sends a message tied to a specific job application thread.
 *       **Recruiter:** must own the job and specify a `recipientId` who has applied and not been rejected.
 *       **Job seeker:** must have applied to the job and not been rejected.
 *       Triggers a notification for the recipient.
 *     tags: [Messaging]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job the conversation is about
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Message text
 *               recipientId:
 *                 type: string
 *                 description: Required when sender is a recruiter — the job seeker's user ID
 *           examples:
 *             recruiter:
 *               summary: Recruiter sending a message
 *               value:
 *                 body: "We'd like to schedule an interview. Are you available next week?"
 *                 recipientId: "64a1f2c3b4e5f67890abcdef"
 *             jobSeeker:
 *               summary: Job seeker replying
 *               value:
 *                 body: "Yes, I'm available Monday or Tuesday afternoon."
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error — missing body, body too long, recipientId missing/invalid, or applicant rejected
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not the job owner, or recipient has not applied to this job
 *       404:
 *         description: Job not found
 */
router.post(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker"),
  sendMessage
);

/**
 * @swagger
 * /conversations/{jobId}/messages:
 *   get:
 *     summary: Get messages in a conversation thread
 *     description: >
 *       Returns a paginated list of messages sorted oldest-first (page 1 = oldest).
 *       Non-admin callers' unread messages in the thread are marked as read automatically.
 *
 *       **Recruiter:** must own the job and supply `?with={applicantId}`.
 *
 *       **Job seeker:** must have applied to the job; the other party is the recruiter.
 *
 *       **Admin:** supply `?sender={userId}&recipient={userId}` to view any thread without marking messages as read.
 *     tags: [Messaging]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the job the conversation is about
 *       - in: query
 *         name: with
 *         schema:
 *           type: string
 *         description: "(Recruiter only) The applicant's user ID"
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: "(Admin only) One participant's user ID"
 *       - in: query
 *         name: recipient
 *         schema:
 *           type: string
 *         description: "(Admin only) The other participant's user ID"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number (page 1 = oldest messages)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 100
 *         description: Messages per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated messages oldest-first
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedMessages'
 *       400:
 *         description: Validation error — missing or invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — not the job owner, or user has not applied to this job
 *       404:
 *         description: Job not found
 */
router.get(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker", "admin"),
  getMessages
);

module.exports = router;
