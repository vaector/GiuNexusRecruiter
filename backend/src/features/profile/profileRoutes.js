const express = require("express");

const { protect } = require("../../middleware/auth");
const {
	getMyProfile,
	updateMyProfile,
	changeMyPassword,
} = require("./profileController");

const router = express.Router();

router.get("/", protect, getMyProfile);
router.patch("/", protect, updateMyProfile);
router.patch("/change-password", protect, changeMyPassword);

module.exports = router;
