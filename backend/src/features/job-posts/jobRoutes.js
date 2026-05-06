const express = require("express");
const router = express.Router();
const { getAllJobs, getMyJobs, getJobById } = require("./jobController");
const { protect, authorize } = require("../../middleware/auth");

// my-jobs MUST be before /:id
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);
router.get("/:id", getJobById);
router.get("/", getAllJobs);

module.exports = router;
