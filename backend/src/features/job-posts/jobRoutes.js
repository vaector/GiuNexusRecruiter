const express = require("express");
const router = express.Router();
const { getAllJobs, getMyJobs, getSavedJobs, getJobById, createJob, toggleSaveJob, updateJob, deleteJob, getRecommendedJobs } = require("./jobController");
const { applyToJob } = require("../application/applicationController");
const { protect, authorize } = require("../../middleware/auth");

router.get("/recommended", protect, authorize("jobSeeker"), getRecommendedJobs);
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);
router.get("/saved", protect, authorize("jobSeeker"), getSavedJobs);
router.get("/", getAllJobs);
router.get("/:id", getJobById);
router.post("/", protect, authorize("recruiter"), createJob);
router.patch("/:id", protect, authorize("recruiter"), updateJob);
router.delete("/:id", protect, authorize("recruiter", "admin"), deleteJob);
router.post("/:id/save", protect, authorize("jobSeeker"), toggleSaveJob);
router.post("/:jobId/apply", protect, authorize("jobSeeker"), applyToJob);

module.exports = router;
