const asyncHandler = require("../../middleware/asyncHandler");
const Document = require('./document');
const Application = require('../application/Application');
const { uploadFile } = require('../../services/cloudinaryService');
const crypto = require('crypto');

const RECRUITER_TYPES = ['offer_letter', 'contract', 'nda'];
const JOBSEEKER_TYPES = ['cv', 'cover_letter'];

const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// POST /api/v1/documents
const uploadDocument = asyncHandler(async (req, res, next) => {
    const { applicationId, type } = req.body;

    if (!applicationId || !type) {
        return next(createError(400, 'applicationId and type are required'));
    }

    if (!req.file) {
        return next(createError(400, 'A file is required'));
    }

    if (req.user.role === 'recruiter' && !RECRUITER_TYPES.includes(type)) {
        return next(createError(400, 'Recruiters can only upload offer letters, contracts, and NDAs'));
    }

    if (req.user.role === 'jobSeeker' && !JOBSEEKER_TYPES.includes(type)) {
        return next(createError(400, 'Job seekers can only upload CVs and cover letters'));
    }

    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
        return next(createError(404, 'Application not found'));
    }

    if (req.user.role === 'recruiter') {
        if (application.job.createdBy.toString() !== req.user._id.toString()) {
            return next(createError(403, 'Not authorised to upload documents for this application'));
        }
    } else if (req.user.role === 'jobSeeker') {
        if (application.user.toString() !== req.user._id.toString()) {
            return next(createError(403, 'Not authorised to upload documents for this application'));
        }
    } else {
        return next(createError(403, 'Not authorised to upload documents'));
    }

    let fileUrl;
    try {
        const result = await uploadFile(req.file.buffer, req.file.mimetype);
        fileUrl = result.secure_url;
    } catch {
        return next(createError(500, 'Failed to upload file'));
    }

    const fileHash = crypto
        .createHash('sha256')
        .update(req.file.buffer)
        .digest('hex');

    const document = await Document.create({
        application: applicationId,
        type,
        fileUrl,
        fileName: req.file.originalname,
        uploadedBy: req.user._id,
        fileHash,
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
        populate: [
            { path: 'job' },
            { path: 'user', select: '_id'}
        ]
    });

    if (!document) {
        return next(createError(404, 'Document not found'));
    }

    if (document.uploadedBy.toString() === req.user._id.toString()) {
        return next(createError(400, 'You cannot sign a document you uploaded'));
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

    document.signatureToken = crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(`${document._id}${req.user._id}${Date.now()}`)
        .digest('hex');

    await document.save();

    res.status(200).json({ success: true, document });
});

// GET /api/v1/documents/:id/verify
const verifyDocument = asyncHandler(async (req, res, next) => {
  const document = await Document.findById(req.params.id)
    .populate('uploadedBy', 'name email')
    .populate('signedBy', 'name email');

  if (!document) {
    return next(createError(404, 'Document not found'));
  }

  res.status(200).json({
    success: true,
    verification: {
      fileHash: document.fileHash,
      isSigned: document.status === 'signed',
      signedBy: document.signedBy,
      signedAt: document.signedAt,
      signatureToken: document.signatureToken,
      uploadedBy: document.uploadedBy,
      uploadedAt: document.createdAt,
    }
  });
});

module.exports = { uploadDocument, getDocuments, signDocument, verifyDocument };
