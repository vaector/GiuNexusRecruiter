const mongoose = require("mongoose");
const { ReportReason, ReportStatus } = require("../../enums/index");

const ReportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetModel: {
      type: String,
      enum: ["JobPost", "User"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: true,
    },
    details: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetModel: 1, targetId: 1 });
ReportSchema.index({ reporter: 1, targetModel: 1, targetId: 1 }, { unique: true });

module.exports =
  mongoose.models.Report ||
  mongoose.model("Report", ReportSchema);
