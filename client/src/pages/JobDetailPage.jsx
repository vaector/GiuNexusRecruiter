// Single job detail view
// GET /api/v1/jobs/:id
// Shows description, requirements, salary, category badge
// Shows workplaceType (on-site/remote/hybrid), isRemote flag
// Shows perks list, hiringStages pipeline, applicationDeadline countdown
// Shows viewCount and aiCategoryConfidence alongside category badge
// Apply button opens modal with optional coverLetter textarea
// POST /api/v1/jobs/:id/apply
// Save/unsave bookmark icon via POST /api/v1/jobs/:id/save
// Replaces Apply button with status badge if already applied
// Report button opens modal via POST /api/v1/reports
