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
module.exports = router;
