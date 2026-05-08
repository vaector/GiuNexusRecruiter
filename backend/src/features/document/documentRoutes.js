const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const { uploadDocument, getDocuments, signDocument, verifyDocument } = require('./documentController');

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Application document management endpoints
 */

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Upload a document for an application
 *     description: >
 *       Recruiters may upload offer_letter, contract, or nda.
 *       Job seekers may upload cv or cover_letter for their own application.
 *       Accepts PDF, DOC, DOCX, and image files (max 5 MB).
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, applicationId, type]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               applicationId:
 *                 type: string
 *                 description: ID of the application this document belongs to
 *               type:
 *                 type: string
 *                 enum: [offer_letter, contract, nda, cv, cover_letter]
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Missing fields, invalid type for role, or no file provided
 *       403:
 *         description: Not authorised to upload documents for this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Failed to upload file to storage
 */
router.post('/', protect, upload.documentUpload.single('file'), uploadDocument);

/**
 * @swagger
 * /documents/{applicationId}:
 *   get:
 *     summary: Get all documents for an application
 *     description: Accessible by the recruiter who owns the job or the job seeker who submitted the application.
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the application
 *     responses:
 *       200:
 *         description: List of documents sorted by creation date (newest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Not authorised to view these documents
 *       404:
 *         description: Application not found
 */
router.get('/:applicationId', protect, getDocuments);

/**
 * @swagger
 * /documents/{id}/sign:
 *   patch:
 *     summary: Sign a document
 *     description: >
 *       Only the job seeker who owns the application may sign.
 *       A document cannot be signed by the user who uploaded it,
 *       and cannot be signed if already signed or rejected.
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document to sign
 *     responses:
 *       200:
 *         description: Document signed successfully
 *       400:
 *         description: Already signed, rejected, or uploaded by the same user
 *       403:
 *         description: Not authorised to sign this document
 *       404:
 *         description: Document not found
 */
router.patch('/:id/sign', protect, signDocument);

/**
 * @swagger
 * /documents/{id}/verify:
 *   get:
 *     summary: Verify document integrity and signature
 *     description: Returns the document's file hash, signature token, and signer/uploader details for audit purposes.
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the document to verify
 *     responses:
 *       200:
 *         description: Verification details returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 verification:
 *                   type: object
 *                   properties:
 *                     fileHash:
 *                       type: string
 *                     isSigned:
 *                       type: boolean
 *                     signedBy:
 *                       type: object
 *                     signedAt:
 *                       type: string
 *                       format: date-time
 *                     signatureToken:
 *                       type: string
 *                     uploadedBy:
 *                       type: object
 *                     uploadedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Document not found
 */
router.get('/:id/verify', protect, verifyDocument);

module.exports = router;
