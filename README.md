# GIU Nexus — AI-Powered Career & Talent Platform

GIU Nexus is a full-stack web application designed to help university students discover internships and job opportunities while enabling recruiters to efficiently find the most suitable candidates.

What sets GIU Nexus apart from traditional job boards is its integration of AI-powered features using the Hugging Face Inference API. The platform intelligently analyzes user data, automates classification, and delivers personalized recommendations, making the job search process smarter and faster. 

---

## Project Objectives

- Build a full-stack MERN application from scratch
- Design real-world Mongoose schemas for users, jobs, and applications
- Practice Git collaboration using branches, pull requests, and code reviews
- Integrate Hugging Face AI services securely into a Node.js backend
- Deliver the project in structured milestones 

---

## User Roles

### Job Seeker
A university student looking for internships or entry-level positions. Job seekers can create a profile, browse approved job listings, apply to jobs, track their applications, upload supporting evidence such as prior performance reviews, and receive AI-generated skill suggestions based on their profile content. 

### Recruiter
A company representative who can create, edit, and manage job listings. Recruiters can view applicants, update application statuses, and benefit from AI-based job categorization and candidate matching. 

### Admin
System administrators manage recruiter approvals, moderate listings, and monitor platform-wide activity and analytics. 

---

## Key Features

### For Students
- **AI Skill Extraction**  
  Automatically detects skills from student profiles using NLP, reducing the need for manual tagging.

- **Personalized Job Recommendations**  
  Recommends relevant internships and jobs based on profile content, extracted skills, and similarity matching.

- **Profile Management**  
  Create, update, and manage academic and professional profiles, including supporting documents such as prior performance reviews.

- **Application Tracking**  
  Apply to jobs and monitor application progress through the platform. 

### For Recruiters
- **Smart Candidate Discovery**  
  View applicants and identify strong matches based on profile relevance and AI-driven scoring.

- **AI Job Classification**  
  Automatically classifies job postings into technical categories such as Frontend, Backend, AI/ML, DevOps, and Data Engineering.

- **Efficient Job Posting**  
  Create and manage job listings with structured requirements and intelligent categorization.

- **Recruiter Dashboard**  
  Manage active postings, monitor applicant counts, and review candidate profiles. 

### For Admins
- **Recruiter Approval Workflow**  
  Review and approve or reject recruiter accounts before they can post jobs.

- **Listing Moderation**  
  Remove or manage flagged job posts.

- **Platform Analytics**  
  View summary statistics and platform-wide insights. 

---

## AI Capabilities

GIU Nexus uses the Hugging Face Inference API to power:

- **Skill Extraction** using Named Entity Recognition (NER)
- **Job Category Classification** using zero-shot classification
- **Semantic Matching** between student profiles and job descriptions
- **Personalized Recommendations** based on similarity scoring and embeddings

---

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **AI Integration:** Hugging Face Inference API
- **Version Control:** GitHub

---

## Core System Modules

- Authentication and role-based access control
- User profile management
- Job posting and browsing
- Job application workflow
- Recruiter approval system
- AI skill extraction
- AI job classification
- Job recommendation engine
- Admin dashboard and analytics

---

## Messaging API

- `POST /api/v1/conversations/:jobId/messages`
  - Recruiters must provide `recipientId` in the request body.
- `GET /api/v1/conversations/:jobId/messages`
  - Supports `page` and `limit`.
  - Recruiters must provide `with=<applicantId>` as a query parameter.
- `GET /api/v1/conversations`
  - Returns the current user's conversation threads.

---

## Team Members

- [youssefkhaleel0689](https://github.com/youssefkhaleel0689) **Youssef Hassan** — `16008386` — `T16`
- [gasTSK](https://github.com/gasTSK) **Taher Khalaf** — `16007291` — `T16`
- [Tarek16006923](https://github.com/Tarek16006923) **Tarek Ahmed** — `16006923` — `T9`
- [Yassin-Hegazy](https://github.com/Yassin-Hegazy) **Yassin Amr** — `16001061` — `T16`
- [Aequate](https://github.com/aequate) **Amro Taha** — `16007093` — `T11`
- [ZeyadAmr-16005823](https://github.com/ZeyadAmr-16005823) **Zeyad Amr** — `16005823` — `T16`
- [mohammedrizk16008623](https://github.com/mohammedrizk16008623) **Mohammed Fady Rizk** — `16008623` — `T20`
- [FaresEl-Sonbaty](https://github.com/FaresEl-Sonbaty) **Fares Mostafa El Sonbaty** — `16006173` — `T18`
- [AhmedSoliman1023](https://github.com/AhmedSoliman1023) **Ahmed Bahaa Eldein** — `16020317` — `T16`
- [MohabHindawy](https://github.com/MohabHindawy) **Mohab Khaled** — `16006616` — `T9`

---

## Repository Notes

- Use feature branches for development
- Open pull requests before merging to `main`
- Resolve reviews and conflicts collaboratively
- Keep `.env` files and `node_modules/` out of version control 

---

## Project Status

This project is being developed as part of the **Intro to Software Engineering Spring 2026** course at the **German International University**.
