const express = require("express");
const {
  getMyApplications,
  updateApplicationStatus,
} = require("./applicationController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

router.get("/my", protect, authorize("jobSeeker"), getMyApplications);
router.patch(
  "/:id/status",
  protect,
  authorize("recruiter"),
  updateApplicationStatus
);

module.exports = router;
