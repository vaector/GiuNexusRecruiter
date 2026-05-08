# Architecture

This document describes the current backend implementation for GIU Nexus Milestone 2.

## Runtime Shape

The backend is an Express application mounted from `backend/server.js`.

Core middleware:

- `cors`
- `express.json`
- request logging middleware
- Swagger UI at `/api-docs`
- centralized error middleware as the final `app.use`

Mounted API groups:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/profile`
- `/api/v1/jobs`
- `/api/v1/applications`
- `/api/v1/admin`
- `/api/v1/notifications`
- `/api/v1/saved-searches`
- `/api/v1/reports`
- `/api/v1/documents`
- `/api/v1/conversations`
- `/api/v1/referrals`

## Data Layer

MongoDB is accessed through Mongoose. The current implementation uses one `User` collection with a `role` field rather than separate role collections or active Mongoose discriminators.

Primary collections:

- `users`
- `jobposts`
- `applications`
- `notifications`
- `audit_logs`
- `request_logs`
- `saved_searches`
- `reports`
- `application_documents`
- `messages`
- `referrals`

Future schema sketches live under `backend/src/features/_future`, but they are not mounted as runtime features.

## Authentication and Authorization

Authentication uses JWTs signed with `_id`, `role`, and `jti`.

- `protect` validates the Bearer token, checks token blacklist state, loads the user, and attaches it to `req.user`.
- `authorize(...roles)` gates routes by role.
- Passwords are hashed with bcrypt before saving.
- Recruiters register with `status: "pending"` and must be approved by an admin before posting or managing jobs.
- Admin accounts are seeded or inserted directly in the database; they are not self-registered.

Bonus auth behavior:

- Auth routes are rate-limited.
- Logout blacklists the token `jti`.
- Password reset uses an OTP verification step before issuing a reset token.
- MFA can be enabled with email OTP or TOTP.

## Milestone 2 Domain Flow

### Recruiter Flow

1. Recruiter registers and receives `status: "pending"`.
2. Admin approves the recruiter through `PATCH /api/v1/users/:id/status`.
3. Approved recruiter creates a job.
4. Job creation runs AI category classification and stores job embeddings.
5. Recruiter views applicants for owned jobs.
6. Recruiter updates application status for applications on owned jobs.

### Job Seeker Flow

1. Job seeker registers or logs in.
2. Job seeker updates profile bio.
3. Job seeker calls skill extraction.
4. Job seeker browses jobs, gets recommendations, saves open jobs, and applies.
5. Duplicate applications are rejected by controller logic and by a unique compound index.
6. Job seeker views application status through `GET /api/v1/applications/my`.

### Admin Flow

1. Admin is seeded directly.
2. Admin manages users and recruiter approval.
3. Admin views platform stats and all applications.
4. Admin can delete any job post.

## AI Pipeline

The Hugging Face client is initialized once in `backend/src/services/hfService.js`.

### Skill Extraction

`POST /api/v1/profile/extract-skills`

- Reads `user.bio`.
- Calls `dslim/bert-base-NER`.
- Filters organization/misc entities.
- Saves deduplicated skills to `user.skills`.
- On Hugging Face failure, returns existing skills with `200`.

### Job Classification

`POST /api/v1/jobs` and description updates.

- Calls `facebook/bart-large-mnli`.
- Candidate labels: `Frontend`, `Backend`, `AI/ML`, `DevOps`, `Data Engineering`, `Other`.
- Stores the top category and optional confidence.
- On Hugging Face failure, defaults to `Other`.

### Recommendations

`GET /api/v1/jobs/recommended`

- Uses the job seeker's skills as the student text.
- Uses stored `JobPost.embeddings` for open jobs.
- Calls `sentence-transformers/all-MiniLM-L6-v2` for the student embedding.
- Computes cosine similarity in the application layer.
- Sorts jobs by score descending.
- If embeddings are unavailable or the HF call fails, returns open jobs as a fallback.

This is intentionally slightly richer than the Milestone 2 sample approach because job embeddings are stored when jobs are created or updated.

## Compatibility With Milestone 2 Request Shapes

The job model stores richer structured data, but the controller accepts the simple Milestone 2 body:

```json
{
  "location": "Cairo",
  "salary": 5000
}
```

These are normalized internally to:

```json
{
  "location": { "city": "Cairo" },
  "salary": { "min": 5000 }
}
```

Structured objects are also accepted.

## Additive Features

The following features are outside the Milestone 2 base API and are mounted separately or added as optional fields:

- Notifications
- Audit logs
- Request logs and request-log analytics
- Saved searches and saved-search polling
- Reports/moderation
- Application documents and document signing
- Messaging tied to jobs and applications
- Referrals
- Deadline auto-close
- Screening questions
- Application stage history
- Recruiter notes
- AI match scores on applications

These features should remain additive: they should not change the required Milestone 2 flows.

## Testing

The automated test suite covers the Milestone 2 bonus testing requirement:

- register
- login
- create job with AI category
- apply to job
- duplicate application rejection
- profile skill extraction

Tests use:

- Jest
- Supertest
- mongodb-memory-server
- mocked Hugging Face service calls

Postman is used for broader manual testing, including admin approval, recommendations, bonus routes, and additive routes.
