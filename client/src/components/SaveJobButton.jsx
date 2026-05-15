// Bookmark toggle button
// Calls POST /api/v1/jobs/:id/save
// Updates state optimistically
// Disabled when job status is not open
// Props: jobId, initialSaved, jobStatus