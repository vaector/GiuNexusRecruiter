const mongoose = require("mongoose");

const PlatformStatsSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      default: "platform",
      unique: true,
      immutable: true,
    },
    totalUsers: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalApplications: {
      type: Number,
      default: 0,
      min: 0,
    },
    jobsByCategory: {
      type: Map,
      of: Number,
      default: () => ({}),
    },
    applicationsByStatus: {
      type: Map,
      of: Number,
      default: () => ({}),
    },
    avgMatchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: "platform_stats",
  }
);

module.exports =
  mongoose.models.PlatformStats ||
  mongoose.model("PlatformStats", PlatformStatsSchema);
