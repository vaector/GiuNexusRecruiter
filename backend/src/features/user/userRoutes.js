const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById, updateUserStatus, deleteUser } = require("./userController");
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints (admin only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with optional filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, recruiter, jobSeeker]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
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
 *         description: Paginated list of users
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.get("/", protect, authorize("admin"), getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a single user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get("/:id", protect, authorize("admin"), getUserById);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update a user's approval status
 *     tags: [Users]
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
 *                 enum: [approved, rejected, pending]
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user and all associated data
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
