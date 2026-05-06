const express = require("express");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
} = require("./authController");
const { protect } = require("../../middleware/auth");
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);
module.exports = router;