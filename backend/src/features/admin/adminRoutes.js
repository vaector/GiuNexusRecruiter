const express = require("express");
const router = express.Router();
const { getPlatformStats } = require("./adminController");
const { protect, authorize } = require("../../middleware/auth");

router.get("/stats", protect, authorize("admin"), getPlatformStats);

module.exports = router;
