const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const USER_ROLES = ["jobSeeker", "recruiter", "admin"];
const USER_STATUSES = ["pending", "approved", "rejected"];

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    profilePicture: {
      type: String,
    },

    bio: {
      type: String,
    },

    skills: [String],

    role: {
      type: String,
      enum: USER_ROLES,
      default: "jobSeeker",
    },

    status: {
      type: String,
      enum: USER_STATUSES,
      default: "pending",
    },

    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobPost",
      },
    ],

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      index: true,
      trim: true,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },

    otpCode: {
      type: String,
    },

    otpExpire: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;

// --- FUTURE FIELDS (not needed for M2) ---
/*
const {
  Role,
  RecruiterStatus,
  Availability,
  ExperienceLevel,
  CompanySize,
  JobSearchStatus,
  PreviousAppraisalRating,
} = require("../../enums");

const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const NotificationPreferencesSchema = new mongoose.Schema(
  {
    email: {
      type: Boolean,
      default: true,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const PasswordResetSchema = new mongoose.Schema(
  {
    otpHash: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    requestedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const JobSeekerSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    source: {
      type: String,
      enum: ["ai", "user"],
      default: "ai",
    },
    flagged: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const PreviousAppraisalSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    period: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    rating: {
      type: String,
      enum: Object.values(PreviousAppraisalRating),
      required: true,
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true,
      match: [urlRegex, "Invalid URL format"],
    },
    verifiedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const ApplicationStatsSchema = new mongoose.Schema(
  {
    totalApplied: {
      type: Number,
      default: 0,
    },
    totalShortlisted: {
      type: Number,
      default: 0,
    },
    totalRejected: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

userCode: {
  type: String,
  required: true,
  unique: true,
},
linkedIn: {
  type: String,
  match: [urlRegex, "Invalid URL format"],
},
github: {
  type: String,
  match: [urlRegex, "Invalid URL format"],
},
portfolio: {
  type: String,
  match: [urlRegex, "Invalid URL format"],
},
lastActive: {
  type: Date,
  default: Date.now,
},
notificationPreferences: {
  type: NotificationPreferencesSchema,
  default: () => ({}),
},
twoFactorSecret: {
  type: String,
},
twoFactorEnabled: {
  type: Boolean,
  default: false,
},
passwordReset: {
  type: PasswordResetSchema,
  default: () => ({}),
},
referralCode: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
  uppercase: true,
},

// Future role-specific model setup:
// Add this to the UserSchema options if role-specific discriminator models are needed.
discriminatorKey: "role",

const JobSeeker = User.discriminator(
  Role.JOB_SEEKER,
  new mongoose.Schema({
    resumeUrl: {
      type: String,
    },
    preferredRoles: [String],
    availability: {
      type: String,
      enum: Object.values(Availability),
      default: Availability.IMMEDIATELY,
    },
    experienceLevel: {
      type: String,
      enum: Object.values(ExperienceLevel),
      default: ExperienceLevel.STUDENT,
    },
    jobSearchStatus: {
      type: String,
      enum: Object.values(JobSearchStatus),
      default: JobSearchStatus.ACTIVELY_LOOKING,
    },
    applicationStats: {
      type: ApplicationStatsSchema,
      default: () => ({}),
    },
    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    embeddings: [Number],
    skills: [JobSeekerSkillSchema],
    previousAppraisals: [PreviousAppraisalSchema],
  })
);

const Recruiter = User.discriminator(
  Role.RECRUITER,
  new mongoose.Schema({
    companyName: {
      type: String,
    },
    companyWebsite: {
      type: String,
    },
    companyLogo: {
      type: String,
      match: [urlRegex, "Invalid URL format"],
    },
    companySize: {
      type: String,
      enum: Object.values(CompanySize),
    },
  })
);

const Admin = User.discriminator(Role.ADMIN, new mongoose.Schema({}));
*/
