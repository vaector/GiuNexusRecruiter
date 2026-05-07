const express = require("express");
const router = express.Router();
const { getMyProfile, updateMyProfile, changeMyPassword, extractSkills } = require("./profileController");
const { protect, authorize } = require("../../middleware/auth");

router.get("/", protect, getMyProfile);
router.patch("/", protect, updateMyProfile);
router.patch("/change-password", protect, changeMyPassword);
router.post("/extract-skills", protect, authorize("jobSeeker"), extractSkills);

module.exports = router;