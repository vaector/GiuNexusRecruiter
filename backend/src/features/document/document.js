const mongoose = require("mongoose");
const { DocumentType, DocumentStatus } = require("../enums");

const DocumentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    signedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(DocumentStatus),
      default: DocumentStatus.PENDING,
    },
  },
  {
    timestamps: true,
    collection: "application_documents",
  }
);

DocumentSchema.index({ application: 1, type: 1, createdAt: -1 });
DocumentSchema.index({ status: 1, signedAt: -1 });

module.exports =
  mongoose.models.ApplicationDocument ||
  mongoose.model("ApplicationDocument", DocumentSchema);
