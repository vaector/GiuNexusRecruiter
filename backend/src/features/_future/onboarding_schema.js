const mongoose = require("mongoose");
const { OnboardingStatus } = require("../enums");

const OnboardingTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const OnboardingSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "application",
      required: true,
      unique: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tasks: {
      type: [OnboardingTaskSchema],
      default: [],
    },
    signingBonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(OnboardingStatus),
      default: OnboardingStatus.PENDING,
    },
  },
  {
    timestamps: true,
    collection: "onboarding",
  }
);

OnboardingSchema.index({ employee: 1, status: 1 });
OnboardingSchema.index({ recruiter: 1, status: 1 });

module.exports =
  mongoose.models.Onboarding ||
  mongoose.model("Onboarding", OnboardingSchema);
