// Form to edit an existing job post
// GET /api/v1/jobs/:id to load existing values
// PATCH /api/v1/jobs/:id to save changes
// Same fields as CreateJobPage
// workplaceType, perks, hiringStages, applicationDeadline editable
// Editing description re-triggers AI category classification on backend
// Shows current aiCategoryConfidence read only
// Recruiter only, must own the job