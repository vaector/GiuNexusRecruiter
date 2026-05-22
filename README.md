# GIU Nexus - AI-Powered Career and Talent Platform

GIU Nexus is a Node.js/Express backend for a university career platform. It supports job seekers, recruiters, and admins with JWT authentication, role-based access control, job posting, applications, profile management, admin approval workflows, and Hugging Face AI integrations.

The current implementation targets **Software Engineering Spring 2026 - Milestone 3** and also includes selected bonus and additive backend features.

## Live Demo

**[https://giu-nexus-project.vercel.app/](https://giu-nexus-project.vercel.app/)**

- Frontend: Deployed on Vercel
- Backend: Deployed on Railway
- Database: MongoDB Atlas

## Tech Stack

- Frontend: React.js (Vite), React Router v6, Axios, Context API
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- AI: Hugging Face Inference API
- Auth: JWT, bcryptjs
- Email: Nodemailer
- API testing: Postman collection
- Automated tests: Jest, Supertest, mongodb-memory-server
- Docs: Swagger UI at `GET /api-docs`

## Project Structure

```
/
├── client/                   # React frontend (Milestone 3)
│   └── src/
│       ├── components/       # Reusable UI components (Navbar, JobCard, Modal, etc.)
│       ├── pages/            # One file per route / view
│       ├── context/          # AuthContext and any global state
│       ├── services/         # axios instance and API call functions
│       ├── utils/            # Helper functions (e.g., token management)
│       ├── App.jsx           # Router setup
│       └── main.jsx          # Entry point
└── backend/                  # Node.js/Express backend (Milestone 2)
    └── src/
        └── services/
            └── hfService.js  # Shared Hugging Face singleton
```

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

## Milestone 3 Core Scope

Implemented Milestone 3 frontend requirements:

### Authentication & Context

- `AuthContext` wrapping the entire application, exposing `user`, `token`, `login()`, `logout()`, and `isAuthenticated`.
- `services/api.js` axios instance with a request interceptor attaching `Authorization: Bearer <token>` on every request, and a response interceptor that detects 401 responses, calls `logout()`, and redirects to `/login`.
- `PrivateRoute` component redirecting unauthenticated users to `/login`.
- `RoleRoute` component restricting access based on `user.role`.

### Pages

| Route | Component | Access |
|---|---|---|
| `/` | HomePage — trending jobs + Recommended for You section for authenticated job seekers | Public / Job Seeker |
| `/login` | LoginPage — email/password form, stores token + user via AuthContext | Public |
| `/register` | RegisterPage — role selector (jobSeeker / recruiter only), pending approval notice for new recruiters | Public |
| `/forgot-password` | ForgotPasswordPage — email input with generic success message | Public |
| `/reset-password/:token` | ResetPasswordPage — new password form, logs user in with returned token on success | Public |
| `/profile` | ProfilePage — displays name, bio, profile picture, skill chips, and Extract Skills from Bio button | Job Seeker |
| `/profile/edit` | EditProfilePage — form to update name, bio, and profile picture | Private |
| `/profile/change-password` | ChangePasswordPage — current password, new password, confirm new password | Private |
| `/jobs` | JobListPage — browsable grid with keyword, location, type, status, page, and limit filters; category badge on each card | Public |
| `/jobs/:id` | JobDetailPage — description, requirements, salary, category badge, Apply modal, Save/Unsave toggle, application status badge if already applied | Public |
| `/jobs/recommended` | RecommendedJobsPage — AI-ranked jobs by cosine similarity score, score shown on each card | Job Seeker |
| `/jobs/saved` | SavedJobsPage — bookmarked jobs grid with Unsave action | Job Seeker |
| `/recruiter/dashboard` | RecruiterDashboard — own job posts with applicant counts; pending-approval banner shown when `status === "pending"` | Recruiter |
| `/recruiter/jobs/create` | CreateJobPage — job creation form; category auto-assigned by AI and shown read-only on response | Recruiter |
| `/recruiter/jobs/:id/edit` | EditJobPage — edit own job post; editing description re-triggers AI category classification | Recruiter |
| `/recruiter/applicants/:jobId` | ApplicantsPage — applicant table with inline status updates (pending / shortlisted / rejected) | Recruiter |
| `/applications/my` | MyApplicationsPage — applied jobs list with current status badges | Job Seeker |
| `/admin/dashboard` | AdminDashboard — summary cards for users by role, jobs by status, applications by status, and topJobs leaderboard | Admin |
| `/admin/recruiters` | PendingRecruitersPage — pending recruiter list with Approve / Reject actions | Admin |
| `/admin/jobs` | AdminJobsPage — all jobs (open and closed) with admin delete | Admin |
| `/admin/users` | AdminUsersPage — all users with role/status filtering, deletion, and status change | Admin |

### Reusable Components

- `Navbar` — role-aware navigation links based on auth state.
- `Footer` — project name and team info.
- `JobCard` — title, company, type, location, AI category badge, Save/Unsave bookmark for job seekers.
- `ApplicationStatusBadge` — coloured badge for pending, shortlisted, and rejected statuses.
- `SkillChip` — small chip/tag for a single skill string.
- `SaveJobButton` — optimistic bookmark toggle; disabled on non-open jobs.
- `PrivateRoute` — redirects unauthenticated users to `/login`.
- `RoleRoute` — restricts access to pages by `user.role`.
- `Spinner` / `Skeleton` — loading state indicators used across all pages.
- `Modal` — reusable confirmation dialog for deletions and withdrawals.

### AI Features in the UI

- **Skill Chips (NER):** Skills extracted from the user's bio displayed as chips on ProfilePage. Extract Skills from Bio button calls `POST /api/v1/profile/extract-skills` and refreshes chips without a full page reload. Inline error shown if bio is empty, with a link to `/profile/edit`.
- **Category Badge (Zero-shot):** AI-assigned category displayed as a coloured badge on every JobCard and JobDetailPage. Colour map: green (Frontend), blue (Backend), purple (AI/ML), teal (DevOps), orange (Data Engineering), grey (Other).
- **Recommended Jobs (Embeddings):** Dedicated Recommended for You section on HomePage and full RecommendedJobsPage. Calls `GET /api/v1/jobs/recommended`, shows similarity score on each card, displays a skeleton/spinner while loading, and links to Extract Skills on empty-skills state.

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

Implemented Milestone 3 bonus features:

- Deployment: Frontend on Vercel, backend on Railway, database on MongoDB Atlas.
- Good UI/UX: Polished, responsive interface with a component library, consistent layout, and loading/error states throughout.
- AI Cover Letter Suggestion: On the JobDetailPage, job seekers can click "Generate Cover Letter Suggestion" to produce a Hugging Face-generated draft cover letter based on their bio and the job description, displayed in an editable textarea.

## Additional Features Beyond Spec

These additive features span both milestones and should not replace or weaken any core requirements:

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

### Backend

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

### Frontend

Create `client/.env` locally. Do not commit real secrets.

- `VITE_API_URL` — base URL of the running backend (e.g., `http://localhost:5000` locally, or your Railway deployment URL in production)

## Running Locally

### Backend

Install dependencies:

```bash
cd backend
npm install
```

Start the backend:

```bash
npm start
```

Development mode (with hot reload):

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

### Frontend

Install dependencies:

```bash
cd client
npm install
```

Start the development server:

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite). Make sure the backend is running and `VITE_API_URL` is set correctly in `client/.env` before starting.

## Postman

Use `GIUNexus.postman_collection.json` for end-to-end API testing. The collection includes:

- Milestone 2 required scenarios.
- Bonus routes.
- Additional non-spec routes marked as additional.
- Token capture scripts for regular login and MFA verification.

## Team Members

- [Mohab Khaled](https://github.com/MohabHindawy/Software-Project/commits?author=MohabHindawy)
- [Youssef Hassan](https://github.com/MohabHindawy/Software-Project/commits?author=youssefkhaleel0689)
- [Taher Khalaf](https://github.com/MohabHindawy/Software-Project/commits?author=gasTSK)
- [Tarek Ahmed](https://github.com/MohabHindawy/Software-Project/commits?author=Tarek16006923)
- [Yassin Amr](https://github.com/MohabHindawy/Software-Project/commits?author=Yassin-Hegazy)
- [Amro Taha](https://github.com/MohabHindawy/Software-Project/commits?author=Aequate)
- [Zeyad Amr](https://github.com/MohabHindawy/Software-Project/commits?author=ZeyadAmr-16005823)
- [Mohammed Fady Rizk](https://github.com/MohabHindawy/Software-Project/commits?author=mohammedrizk16008623)
- [Fares Mostafa El Sonbaty](https://github.com/MohabHindawy/Software-Project/commits?author=FaresEl-Sonbaty)
- [Ahmed Bahaa Eldein](https://github.com/MohabHindawy/Software-Project/commits?author=AhmedSoliman1023)
