const mongoose = require("mongoose");
const { ApplicationStatus } = require("../enums");

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

    Job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job_post",
      required: true,
    },

    coverLetter: {
      type: String,
      minlength: 10,
      maxlength: 2000,
    },

    applicationStatus: {
      type: String,
      enum: Object.values(ApplicationStatus),
      required: true,
      default: ApplicationStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Application ||
  mongoose.model("application", Application);