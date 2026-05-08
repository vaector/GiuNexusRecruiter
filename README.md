# GIU Nexus - AI-Powered Career and Talent Platform

GIU Nexus is a Node.js/Express backend for a university career platform. It supports job seekers, recruiters, and admins with JWT authentication, role-based access control, job posting, applications, profile management, admin approval workflows, and Hugging Face AI integrations.

The current implementation targets **Software Engineering Spring 2026 - Milestone 2** and also includes selected bonus and additive backend features.

## Tech Stack

- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- AI: Hugging Face Inference API
- Auth: JWT, bcryptjs
- Email: Nodemailer
- API testing: Postman collection
- Automated tests: Jest, Supertest, mongodb-memory-server
- Docs: Swagger UI at `GET /api-docs`

## Milestone 2 Core Scope

Implemented Milestone 2 backend requirements:

- Public auth endpoints:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/forgot-password`
  - `PATCH /api/v1/auth/reset-password/:token`
- Private auth endpoint:
  - `POST /api/v1/auth/logout`
- Role-based auth middleware:
  - `protect`
  - `authorize(...roles)`
- Admin user management:
  - `GET /api/v1/users`
  - `GET /api/v1/users/:id`
  - `PATCH /api/v1/users/:id/status`
  - `DELETE /api/v1/users/:id`
  - `GET /api/v1/admin/stats`
- Profile management:
  - `GET /api/v1/profile`
  - `PATCH /api/v1/profile`
  - `PATCH /api/v1/profile/change-password`
  - `POST /api/v1/profile/extract-skills`
- Jobs:
  - `GET /api/v1/jobs`
  - `POST /api/v1/jobs`
  - `GET /api/v1/jobs/recommended`
  - `GET /api/v1/jobs/my-jobs`
  - `GET /api/v1/jobs/saved`
  - `GET /api/v1/jobs/:id`
  - `PATCH /api/v1/jobs/:id`
  - `DELETE /api/v1/jobs/:id`
  - `POST /api/v1/jobs/:id/save`
  - `POST /api/v1/jobs/:jobId/apply`
  - `GET /api/v1/jobs/:jobId/applicants`
- Applications:
  - `GET /api/v1/applications/my`
  - `PATCH /api/v1/applications/:id/status`
  - `GET /api/v1/applications`

## AI Integrations

All Hugging Face calls originate from the backend through a shared singleton in `backend/src/services/hfService.js`.

- Skill extraction:
  - Endpoint: `POST /api/v1/profile/extract-skills`
  - Model: `dslim/bert-base-NER`
  - Reads the user's bio, extracts organization/misc entities, deduplicates them, and saves them to `user.skills`.
- Job category classification:
  - Triggered inside `POST /api/v1/jobs` and when a job description changes.
  - Model: `facebook/bart-large-mnli`
  - Stores the top category on `job.category`.
- Job recommendations:
  - Endpoint: `GET /api/v1/jobs/recommended`
  - Model: `sentence-transformers/all-MiniLM-L6-v2`
  - Stores job embeddings on `JobPost` at write time, then computes cosine similarity against the job seeker's current skills.

## Business Rules

Implemented Milestone 2 business rules:

- Duplicate applications are rejected and protected with a unique compound index on `{ user, job }`.
- Pending recruiters cannot create, update, or manage jobs.
- Recruiters can edit and view applicants only for their own jobs.
- Admins can delete any job post.
- Application status updates are gated by ownership of the related job.
- Closed jobs cannot be saved.
- Closed jobs cannot be applied to.

Compatibility note: job creation accepts the Milestone 2 simple body shape and the richer current shape:

```json
{
  "location": "Cairo",
  "salary": 5000
}
```

is normalized internally to structured `location` and `salary` fields.

## Bonus Features Added

Implemented Milestone 2 bonus features:

- Rate limiting on auth routes with `express-rate-limit`.
- Token blacklist logout using JWT `jti`.
- OTP-based password reset flow with `POST /api/v1/auth/verify-otp`.
- Optional MFA login support with email OTP or TOTP.
- Swagger/OpenAPI documentation at `GET /api-docs`.
- Profile picture upload with `multer` and Cloudinary.
- Extended admin stats with time-series and recruiter/job metrics.
- Jest + Supertest integration tests using mongodb-memory-server.
- GitHub Actions CI workflow.
- Dockerfile and docker-compose setup.

## Additional Features Outside Milestone 2

These are additive features and should not replace or weaken Milestone 2 requirements:

- In-app notifications for account approval, applications, messages, referrals, and job closure.
- Audit logs for selected admin, job, and application actions.
- Request logging and admin request-log analytics.
- Saved searches with a lightweight polling service for matching new jobs.
- Reports/moderation workflow for users and job posts.
- Application documents for CVs, cover letters, offers, contracts, and NDAs.
- Document signing and verification metadata.
- Job seeker/recruiter messaging tied to job application threads.
- Referral requests and referral status tracking.
- Deadline auto-close for expired job postings.
- Application stage history, recruiter notes, screening questions, and AI match scores.

## Environment

Create `backend/.env` locally. Do not commit real secrets.

Required variables are documented in `backend/.env.example`:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `HF_TOKEN`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

`seed.js` accepts either `MONGO_URI` or `MONGODB_URI`.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

Development mode:

```bash
npm run dev
```

Run tests:

```bash
npm test -- --runInBand
```

Seed an admin account:

```bash
node seed.js
```

Admin accounts are intentionally not self-registered through `/auth/register`.

## Postman

Use `GIUNexus.postman_collection.json` for end-to-end API testing. The collection includes:

- Milestone 2 required scenarios.
- Bonus routes.
- Additional non-spec routes marked as additional.
- Token capture scripts for regular login and MFA verification.

## Team Members

- [youssefkhaleel0689](https://github.com/youssefkhaleel0689) **Youssef Hassan** - `16008386` - `T16`
- [gasTSK](https://github.com/gasTSK) **Taher Khalaf** - `16007291` - `T16`
- [Tarek16006923](https://github.com/Tarek16006923) **Tarek Ahmed** - `16006923` - `T9`
- [Yassin-Hegazy](https://github.com/Yassin-Hegazy) **Yassin Amr** - `16001061` - `T16`
- [Aequate](https://github.com/aequate) **Amro Taha** - `16007093` - `T11`
- [ZeyadAmr-16005823](https://github.com/ZeyadAmr-16005823) **Zeyad Amr** - `16005823` - `T16`
- [mohammedrizk16008623](https://github.com/mohammedrizk16008623) **Mohammed Fady Rizk** - `16008623` - `T20`
- [FaresEl-Sonbaty](https://github.com/FaresEl-Sonbaty) **Fares Mostafa El Sonbaty** - `16006173` - `T18`
- [AhmedSoliman1023](https://github.com/AhmedSoliman1023) **Ahmed Bahaa Eldein** - `16020317` - `T16`
- [MohabHindawy](https://github.com/MohabHindawy) **Mohab Khaled** - `16006616` - `T9`
