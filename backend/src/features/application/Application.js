const mongoose = require("mongoose");

const {
  ApplicationStatus,
  HiringStage,
} = require("../../enums");

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
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING,
  },

  appliedAt: {
    type: Date,
    default: Date.now,
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

recruiterNotes: {
  type: String,
  maxlength: 1000,
},

withdrawnAt: {
  type: Date,
},

applicationCode: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
  uppercase: true,
},

stageHistory: [StageHistorySchema],

screeningAnswers: [ScreeningAnswerSchema],
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

ApplicationSchema.pre('save', async function (next) {
  if (this.isNew && !this.applicationCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code, exists, attempts = 0;
    do {
      code = 'APP-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      exists = await mongoose.models.Application.findOne({ applicationCode: code });
      attempts++;
    } while (exists && attempts < 10);
    this.applicationCode = code;
  }
  next();
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

interviewSchedule: {
  type: InterviewScheduleSchema,
  default: undefined,
},



Application.index({ applicationStatus: 1, createdAt: -1 });
Application.index({ "interviewSchedule.scheduledAt": 1 });
*/
