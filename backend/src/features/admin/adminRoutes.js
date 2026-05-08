const express = require("express");
const router = express.Router();
const { getPlatformStats } = require("./adminController");
const { protect, authorize } = require("../../middleware/auth");
const { getRequestLogs, getRequestLogStats } = require('../requestLog/requestController');
const { getAuditLogs } = require('../auditLog/auditController');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only platform management endpoints
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform-wide statistics and time-series data
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Stats including user counts by role, job statuses, application trends, top jobs, and top recruiters
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/stats", protect, authorize("admin"), getPlatformStats);

/**
 * @swagger
 * /admin/request-logs/stats:
 *   get:
 *     summary: Get aggregated request log statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Stats including slowest routes, error rates, and AI call count
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get('/request-logs/stats', protect, authorize('admin'), getRequestLogStats);

/**
 * @swagger
 * /admin/request-logs:
 *   get:
 *     summary: Get paginated request logs
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [GET, POST, PATCH, DELETE]
 *       - in: query
 *         name: statusCode
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isError
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of request logs
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get('/request-logs', protect, authorize('admin'), getRequestLogs);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get paginated audit logs
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: actorName
 *         schema:
 *           type: string
 *       - in: query
 *         name: actorRole
 *         schema:
 *           type: string
 *           enum: [jobSeeker, recruiter, admin, system]
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [USER_CREATED, USER_DELETED, USER_BANNED, USER_PASSWORD_RESET, JOB_CREATED, JOB_DELETED, JOB_CLOSED, JOB_AUTO_CLOSED, APPLICATION_CREATED, APPLICATION_SHORTLISTED, APPLICATION_REJECTED, APPLICATION_WITHDRAWN, RECRUITER_APPROVED, RECRUITER_REJECTED]
 *       - in: query
 *         name: targetModel
 *         schema:
 *           type: string
 *           enum: [User, JobPost, Application]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Paginated list of audit logs
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get('/audit-logs', protect, authorize('admin'), getAuditLogs);

module.exports = router;
