const mongoose = require("mongoose");
const { ReferralStatus } = require("../../enums");

const ReferralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    code: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      default: ReferralStatus.PENDING,
    },
    message: {
      type: String,
      maxlength: 300,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: "referrals",
  }
);

ReferralSchema.index({ referrer: 1, createdAt: -1 });
ReferralSchema.index({ referred: 1, createdAt: -1 });
ReferralSchema.index({ job: 1, status: 1 });

module.exports =
  mongoose.models.Referral ||
  mongoose.model("Referral", ReferralSchema);
