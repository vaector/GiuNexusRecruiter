// JobPost Model | Jobs: Browse & Detail

const mongoose = require("mongoose");

const EXCHANGE_RATES_TO_USD = { USD: 1, EGP: 0.02, EUR: 1.08, GBP: 1.27 };

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

    location: LocationSchema,

    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },

    salary: SalarySchema,

    screeningQuestions: [ScreeningQuestionSchema],

    category: {
      type: String,
    },

    totalSlots: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.OPEN,
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

    requiresCv: {
      type: Boolean,
      default: true,
    },

    requiresCoverLetter: {
      type: Boolean,
      default: false,
    },

    experience: {
      minYears: Number,
    },

    requiredEducation: {
      type: String,
      enum: ['none', 'high_school', 'bachelor', 'master', 'phd'],
      default: 'none',
    },
    requiredEducationField: {
      type: String, // e.g. "Computer Science", "Engineering"
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

  if (this.salary && this.salary.min && this.salary.currency) {
    const rate = EXCHANGE_RATES_TO_USD[this.salary.currency] || 1;
    this.salary.normalizedUSD = Math.round(this.salary.min * rate * 100) / 100;
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

// --- FUTURE FIELDS ---
/*
  optimisticConcurrency: true,
*/
