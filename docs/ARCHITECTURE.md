## 1. Data Layer
GIU Nexus uses MongoDB with Mongoose for primary storage.
`User` is one collection with discriminators for `jobSeeker`, `recruiter`, and `admin`.
This keeps authentication simple and lets other collections reference one shared identity model.

Core business data lives in `JobPost`, `Application`, `Notification`, `AuditLog`, `SavedSearch`, and `Report`.
`Application` links a job seeker to a job post and stores status history, recruiter notes, screening answers, and the saved AI match score.
Indexes focus on common access paths such as job filtering, recruiter-owned posts, duplicate-application prevention, unread notifications, audit tracing, and moderation queues.

Embeddings are stored directly on `JobSeeker` and `JobPost`.
This keeps writes simple and avoids a separate vector store for now.
The tradeoff is that similarity search stays application-driven and will not scale as far as dedicated ANN infrastructure.
`JobSeeker` also stores applicant-owned supporting evidence such as prior employer performance reviews in `previousAppraisals`.
These are uploaded once on the candidate profile and shown during application review without being treated as platform-generated appraisals.

## 2. AI Pipeline
The AI pipeline has three main entry points.
Profile updates extract skills from the bio and generate a `JobSeeker` embedding.
Job post updates extract skills, infer category support, and generate a `JobPost` embedding.

Recommendations load stored embeddings and compute cosine similarity in the application layer.
That score can be combined with business filters like category, location, remote status, and job requirements.
When a student applies, the final `aiMatchScore` is saved on `Application`.

AI work should run asynchronously where possible.
That reduces request latency, makes retries easier, and keeps model failures separate from the main business write.

## 3. Event System
Milestone 2 uses an in-process Node.js `EventEmitter` style domain-event layer.
Controllers handle validation, authorization, and the main write.
After that, they emit semantic events like `application:created` or `application:shortlisted`.

Listeners handle side effects such as notifications, audit logs, stat updates, and queued AI work.
This keeps controllers smaller and makes new side effects easier to add.
The tradeoff is that event flows must handle ordering, idempotency, and partial failures carefully.

## 4. Hiring Pipeline
`Application` supports a multi-stage hiring flow such as screening, interview, offer, contract, accepted, and rejected.
Each stage change is stored in `stageHistory` so the system keeps a clear candidate timeline.
Interview details can live in an `interviewSchedule` subdocument.

Hiring documents like offer letters, contracts, and NDAs live in a separate `ApplicationDocument` collection linked to the application.
That collection stays distinct from profile evidence like resumes, portfolios, and prior performance-review PDFs stored on `JobSeeker`.
This makes the platform closer to a real ATS instead of a simple apply-or-reject system.

## 5. Real-Time Communication
Recruiters and candidates can communicate through `Conversation` and `Message`.
Conversations group participants and can optionally relate to a specific job.
Messages store sender, content, read state, and optional attachments.

Socket.io powers real-time delivery by placing connected users into conversation rooms and emitting message events.
The same real-time foundation can also support notifications and recruiter workflow updates.

## 6. Post-Hire Onboarding
After a candidate signs a contract, the system can create an `Onboarding` document linked to the accepted application.
It stores recruiter-assigned tasks, the start date, signing bonus, and progress state.
This extends the platform beyond hiring into early employee onboarding.

## 7. Admin Analytics
For fast admin dashboards, the platform can maintain a `PlatformStats` document with precomputed totals and grouped counts.
This keeps top-level reads simple and fast while detailed reporting can still come from the base collections.
