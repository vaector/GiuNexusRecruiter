const mongoose = require("mongoose");
const {
  ApplicationStatus,
  HiringStage,
  InterviewType,
} = require("../enums");

const StageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      required: true,
      enum: Object.values(HiringStage),
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const InterviewScheduleSchema = new mongoose.Schema(
  {
    scheduledAt: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: Object.values(InterviewType),
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  { _id: false }
);

const ScreeningAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
    },
    answer: {
      type: String,
    },
  },
  { _id: false }
);

const Application = new mongoose.Schema(
  {
    applicationCode: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job_post",
      required: true,
    },

    coverLetter: {
      type: String,
      minlength: 10,
      maxlength: 2000,
    },

    cvUrl: {
      type: String,
    },

    coverLetterUrl: {
      type: String,
    },

    aiMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    applicationStatus: {
      type: String,
      enum: Object.values(ApplicationStatus),
      required: true,
      default: ApplicationStatus.PENDING,
    },

    stageHistory: [StageHistorySchema],

    interviewSchedule: {
      type: InterviewScheduleSchema,
      default: undefined,
    },

    recruiterNotes: {
      type: String,
      maxlength: 1000,
    },

    screeningAnswers: [ScreeningAnswerSchema],

    withdrawnAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

Application.index({ user: 1, Job: 1 }, { unique: true });
Application.index({ applicationStatus: 1, createdAt: -1 });
Application.index({ "interviewSchedule.scheduledAt": 1 });

module.exports =
  mongoose.models.application ||
  mongoose.model("application", Application);
