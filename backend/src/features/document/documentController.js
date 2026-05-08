const asyncHandler = require("../../middleware/asyncHandler");
const Document = require('./document');
const Application = require('../application/application');
const JobPost = require('../jobPost/jobPost');

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// POST /api/v1/documents
const uploadDocument = asyncHandler(async (req, res, next) => {
  const { applicationId, type, fileUrl, fileName } = req.body;

  if (!applicationId || !type || !fileUrl) {
    return next(createError(400, 'applicationId, type, and fileUrl are required'));
  }

  const application = await Application.findById(applicationId).populate('job');
  if (!application) {
    return next(createError(404, 'Application not found'));
  }

  // Only the recruiter who owns the job can upload documents
  if (application.job.createdBy.toString() !== req.user._id.toString()) {
    return next(createError(403, 'Not authorised to upload documents for this application'));
  }

  const document = await Document.create({
    application: applicationId,
    type,
    fileUrl,
    fileName,
    uploadedBy: req.user._id,
  });

  res.status(201).json({ success: true, document });
});

// GET /api/v1/documents/:applicationId
const getDocuments = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.applicationId).populate('job');
  if (!application) {
    return next(createError(404, 'Application not found'));
  }

  const isRecruiter = application.job.createdBy.toString() === req.user._id.toString();
  const isApplicant = application.user.toString() === req.user._id.toString();

  if (!isRecruiter && !isApplicant) {
    return next(createError(403, 'Not authorised to view these documents'));
  }

  const documents = await Document.find({ application: req.params.applicationId })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, total: documents.length, documents });
});

// PATCH /api/v1/documents/:id/sign
const signDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id).populate({
    path: 'application',
    populate: { path: 'job' }
  });

  if (!document) {
    return next(createError(404, 'Document not found'));
  }

  // Only the job seeker who owns the application can sign
  if (document.application.user.toString() !== req.user._id.toString()) {
    return next(createError(403, 'Not authorised to sign this document'));
  }

  if (document.status === 'signed') {
    return next(createError(400, 'Document has already been signed'));
  }

  if (document.status === 'rejected') {
    return next(createError(400, 'Cannot sign a rejected document'));
  }

  document.status = 'signed';
  document.signedAt = new Date();
  document.signedBy = req.user._id;

  await document.save();

  res.status(200).json({ success: true, document });
});

module.exports = { uploadDocument, getDocuments, signDocument };