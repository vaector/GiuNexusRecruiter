const express = require("express");

const {
  getConversations,
  getMessages,
  sendMessage,
} = require("./messageController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("recruiter", "jobSeeker"), getConversations);
router.post(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker"),
  sendMessage
);
router.get(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker"),
  getMessages
);

module.exports = router;
