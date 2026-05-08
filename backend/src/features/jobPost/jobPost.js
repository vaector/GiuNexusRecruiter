// JobPost Model | Jobs: Browse & Detail

const mongoose = require("mongoose");

const JOB_TYPES = ["full-time", "part-time", "internship"];
const JOB_STATUSES = ["open", "closed"];

const {
  JobType,
  JobStatus,
  PublishStatus,
  EducationDegrees,
  SalaryPeriod,
  ScreeningQuestionType,
  WorkplaceType,
  SupportedCurrency,
  HiringStage,
} = require("../../enums");

const JobPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    requirements: {
      type: [String],
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: JOB_TYPES,
      required: true,
    },

    salary: {
      type: Number,
    },

    category: {
      type: String,
    },

    totalSlots: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "open",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    applicationDeadline: {
      type: Date,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    aiCategoryConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },

    embeddings: [Number],

    isRemote: {
      type: Boolean,
      default: false,
    },

    workplaceType: {
      type: String,
      enum: Object.values(WorkplaceType),
      default: WorkplaceType.ON_SITE,
    },

    perks: [String],

    hiringStages: {
      type: [
        {
          type: String,
          enum: Object.values(HiringStage),
        },
      ],
      default: [
        HiringStage.PENDING,
        HiringStage.SCREENING,
        HiringStage.INTERVIEW,
        HiringStage.OFFER,
        HiringStage.CONTRACT_SENT,
        HiringStage.ACCEPTED,
      ],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

JobPostSchema.pre("save", function (next) {
  if (this.workplaceType === WorkplaceType.ON_SITE) {
    this.isRemote = false;
  } else if (
    this.workplaceType === WorkplaceType.REMOTE ||
    this.workplaceType === WorkplaceType.HYBRID
  ) {
    this.isRemote = true;
  }

  next();
});

JobPostSchema.index({ category: 1, status: 1 });
JobPostSchema.index({ createdBy: 1 });

JobPostSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports =
  mongoose.models.JobPost || mongoose.model("JobPost", JobPostSchema);

// --- FUTURE FIELDS (not needed for M2) ---
/*

const LocationSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String },
  },
  { _id: false }
);

const SalarySchema = new mongoose.Schema(
  {
    min: {
      type: Number,
    },
    max: {
      type: Number,
    },
    currency: {
      type: String,
      enum: Object.values(SupportedCurrency),
      default: "USD",
    },
    period: {
      type: String,
      enum: Object.values(SalaryPeriod),
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    normalizedUSD: {
      type: Number,
    },
  },
  { _id: false }
);

const ScreeningQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ScreeningQuestionType),
      required: true,
    },
    options: [String],
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

requirements: {
  education: {
    degree: {
      type: String,
      enum: EducationDegrees,
    },
    field: String,
  },
  experience: {
    minYears: Number,
  },
  skills: [String],
  certificates: [String],
  other: [String],
  requiresCv: {
    type: Boolean,
    default: true,
  },
  requiresCoverLetter: {
    type: Boolean,
    default: false,
  },
},

location: LocationSchema,


salary: SalarySchema,


skills: [String],

screeningQuestions: [ScreeningQuestionSchema],

published: {
  type: String,
  enum: Object.values(PublishStatus),
  default: PublishStatus.PENDING,
},

optimisticConcurrency: true,

JobPostSchema.index({ "requirements.skills": 1 });
*/
