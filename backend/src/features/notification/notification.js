const mongoose = require("mongoose");
const { NotificationType } = require("../../enums/index");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });

NotificationSchema.statics.send = async function ({
  recipient,
  type,
  title,
  message,
  relatedJob = null,
  relatedApplication = null,
}) {
  try {
    await this.create({
      recipient,
      type,
      title,
      message,
      relatedJob,
      relatedApplication,
    });
  } catch (err) {
    console.error('[Notification] Failed to send notification:', err.message);
  }
};

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
