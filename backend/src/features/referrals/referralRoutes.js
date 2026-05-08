const express = require("express");
const {
  getMyCode,
  requestReferral,
  respondToReferral,
  getSentReferrals,
  getReceivedReferrals,
  listAllReferrals,
  updateReferralStatus,
} = require("./referralController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

// Static routes must come before /:id routes
router.post("/request", protect, authorize("jobSeeker"), requestReferral);
router.get("/my-code", protect, getMyCode);
router.get("/sent", protect, getSentReferrals);
router.get("/received", protect, getReceivedReferrals);
router.get("/", protect, authorize("admin"), listAllReferrals);

// Dynamic param routes
router.patch("/:id/respond", protect, respondToReferral);
router.patch("/:id/status", protect, authorize("admin"), updateReferralStatus);

module.exports = router;
