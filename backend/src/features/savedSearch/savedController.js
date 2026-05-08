const asyncHandler = require("../../middleware/asyncHandler");
const SavedSearch = require('./savedSearch');

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// POST /api/v1/saved-searches
const createSavedSearch = asyncHandler(async (req, res, next) => {
  const { name, filters, alertEnabled } = req.body;

  if (!name) {
    return next(createError(400, 'Name is required'));
  }

  const savedSearch = await SavedSearch.create({
    user: req.user._id,
    name,
    filters: filters || {},
    alertEnabled: alertEnabled ?? false,
  });

  res.status(201).json({ success: true, savedSearch });
});

// GET /api/v1/saved-searches
const getSavedSearches = asyncHandler(async (req, res) => {
  const savedSearches = await SavedSearch.find({
    user: req.user._id,
    active: true,
  }).sort({ createdAt: -1 });

  res.status(200).json({ success: true, total: savedSearches.length, savedSearches });
});

// DELETE /api/v1/saved-searches/:id
const deleteSavedSearch = asyncHandler(async (req, res, next) => {
  const savedSearch = await SavedSearch.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!savedSearch) {
    return next(createError(404, 'Saved search not found'));
  }

  savedSearch.active = false;
  await savedSearch.save();

  res.status(200).json({ success: true, message: 'Saved search deleted' });
});

module.exports = { createSavedSearch, getSavedSearches, deleteSavedSearch };