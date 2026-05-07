const mongoose = require("mongoose");

const APPLICATION_STATUSES = ["pending", "shortlisted", "rejected"];

const ApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPost",
    required: true,
  },

  coverLetter: {
    type: String,
  },

  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: "pending",
  },

  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

ApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

ApplicationSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports =
  mongoose.models.Application ||
  mongoose.model("Application", ApplicationSchema);

// --- FUTURE FIELDS (not needed for M2) ---
/*
const {
  ApplicationStatus,
  HiringStage,
  InterviewType,
} = require("../../enums");

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

applicationCode: {
  type: String,
  required: true,
  unique: true,
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

Application.index({ applicationStatus: 1, createdAt: -1 });
Application.index({ "interviewSchedule.scheduledAt": 1 });
*/
