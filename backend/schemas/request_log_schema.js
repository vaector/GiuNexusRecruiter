const mongoose = require("mongoose");

const RequestLogSchema = new mongoose.Schema(
  {
    route: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    responseTimeMs: {
      type: Number,
      required: true,
    },
    mongoQueryCount: {
      type: Number,
      default: 0,
    },
    aiServiceCalled: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userRole: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    performedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
    collection: "request_logs",
  }
);

RequestLogSchema.index({ route: 1, performedAt: -1 });
RequestLogSchema.index({ statusCode: 1 });
RequestLogSchema.index({ performedAt: -1 });

module.exports =
  mongoose.models.RequestLog ||
  mongoose.model("RequestLog", RequestLogSchema);
