const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("./authController");
const { protect } = require("../../middleware/auth");
const { authLimiter } = require('../../middleware/rateLimiter');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [jobSeeker, recruiter]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Email already in use
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, JWT returned
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and invalidate the current token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authorised
 */
router.post("/logout", protect, logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send a 6-digit OTP to the user's email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post("/forgot-password", authLimiter, forgotPassword);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and receive a password reset token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified, resetToken returned
 *       400:
 *         description: OTP is invalid or has expired
 */
router.post("/verify-otp", authLimiter, verifyOtp);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   patch:
 *     summary: Reset password using the token from verify-otp
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful, new JWT returned
 *       400:
 *         description: Token is invalid or has expired
 */
router.patch("/reset-password/:token", resetPassword);

module.exports = router;