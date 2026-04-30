const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    readAt: {
      type: Date,
    },
    attachmentUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });

module.exports =
  mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
