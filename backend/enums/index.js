const ApplicationStatus = Object.freeze({
  PENDING: "pending",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  CONTRACT_SENT: "contract_sent",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
});

const HiringStage = Object.freeze({
  PENDING: "pending",
  SCREENING: "screening",
  INTERVIEW: "interview",
  OFFER: "offer",
  CONTRACT_SENT: "contract_sent",
  ACCEPTED: "accepted",
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
  JOB_SEEKER: "jobSeeker",
  ADMIN: "admin",
  RECRUITER: "recruiter",
});

const RecruiterStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const Availability = Object.freeze({
  IMMEDIATELY: "immediately",
  ONE_MONTH: "1_month",
  THREE_MONTHS: "3_months",
  NOT_LOOKING: "not_looking",
});

const ExperienceLevel = Object.freeze({
  STUDENT: "student",
  JUNIOR: "junior",
  MID: "mid",
  SENIOR: "senior",
});

const CompanySize = Object.freeze({
  MICRO: "1-10",
  SMALL: "11-50",
  MEDIUM: "51-200",
  LARGE: "201-1000",
  ENTERPRISE: "1000+",
});

const NotificationType = Object.freeze({
  APPLICATION_STATUS_CHANGED: "application_status_changed",
  NEW_APPLICANT: "new_applicant",
  JOB_APPROVED: "job_approved",
  JOB_REJECTED: "job_rejected",
  ACCOUNT_APPROVED: "account_approved",
  ACCOUNT_REJECTED: "account_rejected",
  NEW_JOB_MATCH: "new_job_match",
});

const DocumentType = Object.freeze({
  OFFER_LETTER: "offer_letter",
  CONTRACT: "contract",
  NDA: "nda",
});

const DocumentStatus = Object.freeze({
  PENDING: "pending",
  SIGNED: "signed",
  REJECTED: "rejected",
});

const InterviewType = Object.freeze({
  ONLINE: "online",
  ON_SITE: "on_site",
});

const OnboardingStatus = Object.freeze({
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETE: "complete",
});

const ReferralStatus = Object.freeze({
  PENDING: "pending",
  HIRED: "hired",
  EXPIRED: "expired",
});

const AuditAction = Object.freeze({
  USER_CREATED: "USER_CREATED",
  USER_BANNED: "USER_BANNED",
  JOB_CREATED: "JOB_CREATED",
  JOB_APPROVED: "JOB_APPROVED",
  JOB_REJECTED: "JOB_REJECTED",
  JOB_CLOSED: "JOB_CLOSED",
  APPLICATION_CREATED: "APPLICATION_CREATED",
  APPLICATION_SHORTLISTED: "APPLICATION_SHORTLISTED",
  APPLICATION_REJECTED: "APPLICATION_REJECTED",
  APPLICATION_WITHDRAWN: "APPLICATION_WITHDRAWN",
  RECRUITER_APPROVED: "RECRUITER_APPROVED",
  RECRUITER_REJECTED: "RECRUITER_REJECTED",
});

const JobSearchStatus = Object.freeze({
  ACTIVELY_LOOKING: "actively_looking",
  OPEN_TO_OFFERS: "open_to_offers",
  NOT_LOOKING: "not_looking",
});

const SalaryPeriod = Object.freeze({
  HOURLY: "hourly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
});

const ScreeningQuestionType = Object.freeze({
  TEXT: "text",
  MULTIPLE_CHOICE: "multiple_choice",
  YES_NO: "yes_no",
});

const ReportReason = Object.freeze({
  SPAM: "spam",
  MISLEADING: "misleading",
  INAPPROPRIATE: "inappropriate",
  FAKE_COMPANY: "fake_company",
  OTHER: "other",
});

const ReportStatus = Object.freeze({
  OPEN: "open",
  REVIEWED: "reviewed",
  DISMISSED: "dismissed",
  ACTIONED: "actioned",
});

const WorkplaceType = Object.freeze({
  ON_SITE: "on_site",
  REMOTE: "remote",
  HYBRID: "hybrid",
});

const SupportedCurrency = Object.freeze({
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  EGP: "EGP",
  AED: "AED",
  SAR: "SAR",
});

const EducationDegrees = Object.freeze([
  "high school",
  "bachelor",
  "master",
  "phd",
]);

module.exports = {
  ApplicationStatus,
  HiringStage,
  JobType,
  JobStatus,
  PublishStatus,
  Role,
  RecruiterStatus,
  Availability,
  ExperienceLevel,
  CompanySize,
  NotificationType,
  DocumentType,
  DocumentStatus,
  InterviewType,
  OnboardingStatus,
  ReferralStatus,
  AuditAction,
  JobSearchStatus,
  SalaryPeriod,
  ScreeningQuestionType,
  ReportReason,
  ReportStatus,
  WorkplaceType,
  SupportedCurrency,
  EducationDegrees,
};
