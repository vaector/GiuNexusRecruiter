const express = require("express");
const { getJobApplicants } = require("../application/applicationController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

router.get(
  "/:jobId/applicants",
  protect,
  authorize("recruiter"),
  getJobApplicants
);

module.exports = router;
