const express = require("express");

const {
  getConversations,
  getAdminConversations,
  getMessages,
  sendMessage,
} = require("./messageController");
const { protect, authorize } = require("../../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("recruiter", "jobSeeker"), getConversations);
// /admin must be declared before /:jobId routes so Express doesn't treat "admin" as a jobId
router.get("/admin", protect, authorize("admin"), getAdminConversations);
router.post(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker"),
  sendMessage
);
router.get(
  "/:jobId/messages",
  protect,
  authorize("recruiter", "jobSeeker", "admin"),
  getMessages
);

module.exports = router;
