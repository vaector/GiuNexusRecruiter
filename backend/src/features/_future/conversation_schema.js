const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job_post",
    },
    lastMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "conversations",
  }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ relatedJob: 1, lastMessageAt: -1 });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
