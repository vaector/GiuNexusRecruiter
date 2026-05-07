const express = require("express");
const router = express.Router();
const { listAllApplications, getMyApplications, updateApplicationStatus } = require("./applicationController");
const { protect, authorize } = require("../../middleware/auth");

router.get("/", protect, authorize("admin"), listAllApplications);
router.get("/my", protect, authorize("jobSeeker"), getMyApplications);
router.patch("/:id/status", protect, authorize("recruiter"), updateApplicationStatus);

module.exports = router;
