const express = require("express");
const router = express.Router();
const { createReport, getReports, reviewReport } = require('./reportsController');
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Content reporting and admin review endpoints
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: File a report against a job post or user
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetModel, targetId, reason]
 *             properties:
 *               targetModel:
 *                 type: string
 *                 enum: [JobPost, User]
 *               targetId:
 *                 type: string
 *               reason:
 *                 type: string
 *                 enum: [spam, misleading, inappropriate, fake_company, harassment, other]
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report filed
 *       400:
 *         description: Missing fields or duplicate report
 *       401:
 *         description: Not authorised
 */
router.post('/', protect, createReport);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Get all reports (admin only)
 *     tags: [Reports]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, reviewed, dismissed, actioned]
 *       - in: query
 *         name: targetModel
 *         schema:
 *           type: string
 *           enum: [JobPost, User]
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [spam, misleading, inappropriate, fake_company, harassment, other]
 *     responses:
 *       200:
 *         description: Paginated list of reports
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, authorize('admin'), getReports);

/**
 * @swagger
 * /reports/{id}/review:
 *   patch:
 *     summary: Review a report (admin only)
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, dismissed, actioned]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report reviewed
 *       400:
 *         description: Missing status or already reviewed
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Report not found
 */
router.patch('/:id/review', protect, authorize('admin'), reviewReport);

module.exports = router;