const express = require("express");
const router = express.Router();
const { listAllApplications, getApplication, getMyApplications, updateApplicationStatus, withdrawApplication, updateRecruiterNotes } = require("./applicationController");
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application endpoints
 */

/**
 * @swagger
 * /applications:
 *   get:
 *     summary: Get all applications (admin only)
 *     tags: [Applications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of all applications
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/", protect, authorize("admin"), listAllApplications);

/**
 * @swagger
 * /applications/my:
 *   get:
 *     summary: Get all applications submitted by the authenticated job seeker
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: List of the user's applications
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/my", protect, authorize("jobSeeker"), getMyApplications);

/**
 * @swagger
 * /applications/{id}:
 *   get:
 *     summary: Get a single application by ID
 *     description: Accessible by the applicant, the recruiter who owns the job, or an admin.
 *     tags: [Applications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application details with populated user and job
 *       403:
 *         description: Not authorised to view this application
 *       404:
 *         description: Application not found
 */
router.get("/:id", protect, getApplication);

/**
 * @swagger
 * /applications/{id}/status:
 *   patch:
 *     summary: Update the status of an application (recruiter owner only)
 *     tags: [Applications]
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
 *                 enum: [pending, shortlisted, rejected]
 *     responses:
 *       200:
 *         description: Application status updated
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Not authorised to update this application
 *       404:
 *         description: Application not found
 */
router.patch("/:id/status", protect, authorize("recruiter"), updateApplicationStatus);
router.patch("/:id/notes", protect, authorize("recruiter"), updateRecruiterNotes);
router.delete("/:id/withdraw", protect, authorize("jobSeeker"), withdrawApplication);

module.exports = router;
