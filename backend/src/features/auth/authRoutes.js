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

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", protect, logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-otp", authLimiter, verifyOtp);
router.patch("/reset-password/:token", resetPassword);
module.exports = router;