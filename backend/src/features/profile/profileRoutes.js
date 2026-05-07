const express = require("express");
const router = express.Router();
const { getMyProfile, updateMyProfile, changeMyPassword, extractSkills } = require("./profileController");
const { protect, authorize } = require("../../middleware/auth");
const upload = require("../../middleware/upload")

router.get("/", protect, getMyProfile);
router.patch("/", protect, upload.single("profilePicture"), updateMyProfile);
router.patch("/change-password", protect, changeMyPassword);
router.post("/extract-skills", protect, authorize("jobSeeker"), extractSkills);

module.exports = router;