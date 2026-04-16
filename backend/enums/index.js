const ApplicationStatus = Object.freeze({
  PENDING: "pending",
  SHORTLISTED: "shortlisted",
  REJECTED: "rejected",
});

const JobType = Object.freeze({
  FULL_TIME: "full_time",
  PART_TIME: "part_time",
  INTERNSHIP: "internship",
});

const JobStatus = Object.freeze({
  OPEN: "open",
  CLOSED: "closed",
});

const PublishStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const Role = Object.freeze({
  JOB_SEEKER: "job_seeker",
  ADMIN: "admin",
  RECRUITER: "recruiter",
});

const RecruiterStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const EducationDegrees = Object.freeze([
  "high school",
  "bachelor",
  "master",
  "phd",
]);

module.exports = {
  ApplicationStatus,
  JobType,
  JobStatus,
  PublishStatus,
  Role,
  RecruiterStatus,
  EducationDegrees,
};
