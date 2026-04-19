const mongoose = require("mongoose");
const { JobType, JobStatus, PublishStatus, EducationDegrees } = require("../enums");

const LocationSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String },
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
    },

    location: LocationSchema,

    type: {
      type: String,
      enum: Object.values(JobType),
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    salary: {
      type: Number,
      min: 0,
    },

    totalSlots: {
      type: Number,
      required: true,
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
  }
);

module.exports =
  mongoose.models.JobPost ||
  mongoose.model("job_post", JobPostSchema);
