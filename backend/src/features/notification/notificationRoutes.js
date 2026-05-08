const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('./notificationController');
const { protect } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notification endpoints
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get logged-in user's notifications
 *     tags: [Notifications]
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
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of notifications with unread count
 *       401:
 *         description: Not authorised
 */
router.get('/', protect, getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Not authorised
 */
router.patch('/read-all', protect, markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Not authorised
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', protect, markAsRead);

module.exports = router;