const express = require("express");
const router = express.Router();
const { getAllJobs, getMyJobs, getSavedJobs, getJobById, createJob, toggleSaveJob, updateJob, deleteJob, getRecommendedJobs } = require("./jobController");
const { applyToJob, getJobApplicants } = require("../application/applicationController");
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job posting endpoints
 */

/**
 * @swagger
 * /jobs/recommended:
 *   get:
 *     summary: Get jobs recommended for the authenticated job seeker based on skills
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of recommended jobs
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/recommended", protect, authorize("jobSeeker"), getRecommendedJobs);

/**
 * @swagger
 * /jobs/my-jobs:
 *   get:
 *     summary: Get all jobs posted by the authenticated recruiter
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of jobs
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);

/**
 * @swagger
 * /jobs/saved:
 *   get:
 *     summary: Get all saved jobs for the authenticated job seeker
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of saved jobs
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/saved", protect, authorize("jobSeeker"), getSavedJobs);

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs with optional filters
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of jobs
 */
router.get("/", getAllJobs);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get a single job by ID
 *     tags: [Jobs]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get("/:id", getJobById);

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job posting (approved recruiter only)
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, company, description, requirements, location, type]
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship]
 *               salary:
 *                 type: string
 *               totalSlots:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Account pending approval
 */
router.post("/", protect, authorize("recruiter"), createJob);

/**
 * @swagger
 * /jobs/{id}:
 *   patch:
 *     summary: Update a job posting (recruiter owner only)
 *     tags: [Jobs]
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
 *             properties:
 *               title:
 *                 type: string
 *               company:
 *                 type: string
 *               description:
 *                 type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               type:
 *                 type: string
 *               salary:
 *                 type: string
 *               totalSlots:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [open, closed]
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Not authorised to edit this job
 *       404:
 *         description: Job not found
 */
router.patch("/:id", protect, authorize("recruiter"), updateJob);

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Delete a job posting (recruiter owner or admin)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Not authorised to delete this job
 *       404:
 *         description: Job not found
 */
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

/**
 * @swagger
 * /jobs/{id}/save:
 *   post:
 *     summary: Toggle save/unsave a job (job seeker only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job saved or removed from saved
 *       400:
 *         description: Cannot save a closed job
 *       404:
 *         description: Job not found
 */
router.post("/:id/save", protect, authorize("jobSeeker"), toggleSaveJob);

/**
 * @swagger
 * /jobs/{jobId}/apply:
 *   post:
 *     summary: Apply to a job (job seeker only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Already applied or job is closed
 *       404:
 *         description: Job not found
 */
router.post("/:jobId/apply", protect, authorize("jobSeeker"), applyToJob);

/**
 * @swagger
 * /jobs/{jobId}/applicants:
 *   get:
 *     summary: Get all applicants for a specific job (recruiter owner only)
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of applications for the job
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Not authorised to view applicants for this job
 *       404:
 *         description: Job not found
 */
router.get("/:jobId/applicants", protect, authorize("recruiter"), getJobApplicants);

module.exports = router;