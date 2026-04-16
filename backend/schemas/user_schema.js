const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Role, RecruiterStatus } = require("../enums");

const UserSchema = new mongoose.Schema(
  {
    userCode: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 30
    },

    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
    },

    bio: {
      type: String,
    },

    

    profilePicture: {
      type: String,
    },
  },

  {
    timestamps: true,
    discriminatorKey: "role",
  }

);


const User = mongoose.model("User", UserSchema);


const JobSeeker = User.discriminator(
  Role.JOB_SEEKER,
  new mongoose.Schema({

  skills: [
      {
        type: String,
        minlength: 4,
        maxlength: 50,
      },
  ],

  })
);

const Recruiter = User.discriminator(
  Role.RECRUITER,
  new mongoose.Schema({
    status: {
      type: String,
      enum: Object.values(RecruiterStatus),
      default: RecruiterStatus.PENDING,
    },
  })
);

const Admin = User.discriminator(
  Role.ADMIN,
  new mongoose.Schema({})
);

// Hooks
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Methods
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive data
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.models.User || User;