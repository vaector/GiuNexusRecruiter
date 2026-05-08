const express = require("express");
const { getMyCode, recordReferral, getSentReferrals, listAllReferrals } = require("./referralController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

router.get("/my-code", protect, getMyCode);
router.post("/", protect, authorize("jobSeeker"), recordReferral);
router.get("/sent", protect, getSentReferrals);
router.get("/", protect, authorize("admin"), listAllReferrals);

module.exports = router;
