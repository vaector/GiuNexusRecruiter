const express = require("express");
const { protect, authorize } = require("../../middleware/auth");
const { extractSkills } = require("./profileController");

const router = express.Router();

router.post("/extract-skills", protect, authorize("jobSeeker"), extractSkills);

module.exports = router;