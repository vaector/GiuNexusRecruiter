const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ job: 1, createdAt: 1 });
MessageSchema.index({ job: 1, sender: 1, recipient: 1, createdAt: 1 });
MessageSchema.index({ recipient: 1, readAt: 1 });

MessageSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
