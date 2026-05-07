const express = require("express");
const router = express.Router();
const { getPlatformStats } = require("./adminController");
const { protect, authorize } = require("../../middleware/auth");

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

module.exports = router;
