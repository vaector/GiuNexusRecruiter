const express = require("express");
const router = express.Router();
const { getMyProfile, updateMyProfile, changeMyPassword, extractSkills } = require("./profileController");
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Authenticated user profile endpoints
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Not authorised
 *       404:
 *         description: User not found
 */
router.get("/", protect, getMyProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Update the authenticated user's profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authorised
 *       404:
 *         description: User not found
 */
router.patch("/", protect, updateMyProfile);

/**
 * @swagger
 * /profile/change-password:
 *   patch:
 *     summary: Change the authenticated user's password
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Missing fields or password too short
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 */
router.patch("/change-password", protect, changeMyPassword);

/**
 * @swagger
 * /profile/extract-skills:
 *   post:
 *     summary: Extract skills from the job seeker's bio using AI NER
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Extracted skills saved to profile
 *       400:
 *         description: Bio is empty
 *       401:
 *         description: Not authorised
 *       403:
 *         description: Forbidden
 */
router.post("/extract-skills", protect, authorize("jobSeeker"), extractSkills);

module.exports = router;
