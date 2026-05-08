const express = require("express");
const router = express.Router();
const { createSavedSearch, getSavedSearches, deleteSavedSearch } = require('./savedController');
const { protect, authorize } = require("../../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Saved Searches
 *   description: Job seeker saved search endpoints
 */

/**
 * @swagger
 * /saved-searches:
 *   post:
 *     summary: Create a saved search
 *     tags: [Saved Searches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               alertEnabled:
 *                 type: boolean
 *               filters:
 *                 type: object
 *                 properties:
 *                   keywords:
 *                     type: string
 *                   location:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [full-time, part-time, internship]
 *                   category:
 *                     type: string
 *                   isRemote:
 *                     type: boolean
 *                   salaryMin:
 *                     type: number
 *     responses:
 *       201:
 *         description: Saved search created
 *       400:
 *         description: Name is required or 10 search limit reached
 *       401:
 *         description: Not authorised
 */
router.post('/', protect, authorize('jobSeeker'), createSavedSearch);

/**
 * @swagger
 * /saved-searches:
 *   get:
 *     summary: Get all active saved searches for the logged-in job seeker
 *     tags: [Saved Searches]
 *     responses:
 *       200:
 *         description: List of saved searches
 *       401:
 *         description: Not authorised
 */
router.get('/', protect, authorize('jobSeeker'), getSavedSearches);

/**
 * @swagger
 * /saved-searches/{id}:
 *   delete:
 *     summary: Soft delete a saved search
 *     tags: [Saved Searches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved search deleted
 *       401:
 *         description: Not authorised
 *       404:
 *         description: Saved search not found
 */
router.delete('/:id', protect, authorize('jobSeeker'), deleteSavedSearch);

module.exports = router;