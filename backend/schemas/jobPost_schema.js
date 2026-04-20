const mongoose = require("mongoose");
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
} = require("../enums");

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
      minlength: 4,
      maxlength: 120,
    },

    company: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    embeddings: [Number],

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

    isRemote: {
      type: Boolean,
      default: false,
    },

    workplaceType: {
      type: String,
      enum: Object.values(WorkplaceType),
      required: true,
      default: WorkplaceType.ON_SITE,
    },

    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    salary: SalarySchema,

    applicationDeadline: {
      type: Date,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    totalSlots: {
      type: Number,
      required: true,
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

    skills: [String],

    screeningQuestions: [ScreeningQuestionSchema],

    aiCategoryConfidence: {
      type: Number,
      min: 0,
      max: 1,
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

    published: {
      type: String,
      enum: Object.values(PublishStatus),
      default: PublishStatus.PENDING,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
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
JobPostSchema.index({ "requirements.skills": 1 });

module.exports =
  mongoose.models.job_post ||
  mongoose.model("job_post", JobPostSchema);
