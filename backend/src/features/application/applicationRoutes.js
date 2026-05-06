const express = require("express");
const router = express.Router();
const { listAllApplications } = require("./applicationController");
const { protect, authorize } = require("../../middleware/auth");

// More routes will be added by other team members
router.get("/", protect, authorize("admin"), listAllApplications);

module.exports = router;
