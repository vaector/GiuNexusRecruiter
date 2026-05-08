const mongoose = require("mongoose");
const enums = require("../../enums/index");

const AuditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      required: true,
      enum: Object.values(enums.Role),
    },
    action: {
      type: String,
      required: true,
      enum: Object.values(enums.AuditAction),
    },
    targetModel: {
      type: String,
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
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
    collection: "audit_logs",
  }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ targetModel: 1, targetId: 1 });
AuditLogSchema.index({ action: 1, performedAt: -1 });

AuditLogSchema.statics.record = async function ({ actor, action, targetModel, targetId, metadata = {}, ipAddress, userAgent }) {
  try {
    await this.create({
      actor: actor?._id || null,
      actorRole: actor?.role || 'system',
      action,
      targetModel,
      targetId,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  }
};

module.exports =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", AuditLogSchema);
