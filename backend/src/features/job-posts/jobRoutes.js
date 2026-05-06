const express = require("express");
const router = express.Router();
const { getAllJobs, getMyJobs, getJobById, createJob, updateJob, deleteJob } = require("./jobController");
const { protect, authorize } = require("../../middleware/auth");

// router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);
// router.get("/", getAllJobs);
// router.get("/:id", getJobById);
router.post("/", protect, authorize("recruiter"), createJob);
router.patch("/:id", protect, authorize("recruiter"), updateJob);
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);

module.exports = router;