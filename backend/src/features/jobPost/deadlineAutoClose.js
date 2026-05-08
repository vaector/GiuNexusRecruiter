const JobPost = require("./jobPost");
const AuditLog = require("../auditLog/auditLog");
const Referral = require("../referrals/Referral");
const Notification = require("../notification/notification");
const { AuditAction, NotificationType } = require("../../enums");

const startDeadlineAutoClose = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredJobs = await JobPost.find({
        status: "open",
        applicationDeadline: { $lt: now },
      }).select("_id title company createdBy");

      if (!expiredJobs.length) return;

      await Promise.all(
        expiredJobs.map(async (job) => {
          try {
            job.status = "closed";
            await job.save();

            await AuditLog.record({
              actor: null,
              action: AuditAction.JOB_AUTO_CLOSED,
              targetModel: "JobPost",
              targetId: job._id,
              metadata: { title: job.title, company: job.company },
            });

            await Referral.updateMany(
              { job: job._id, status: "pending" },
              { status: "expired" }
            );

            await Notification.send({
              recipient: job.createdBy,
              type: NotificationType.JOB_CLOSED,
              title: "Job Closed",
              message: `Your job posting "${job.title}" has been automatically closed past its application deadline.`,
              relatedJob: job._id,
            });
          } catch (err) {
            console.error(`[DeadlineAutoClose] Failed to close job ${job._id}:`, err.message);
          }
        })
      );

      console.log(`[DeadlineAutoClose] Closed ${expiredJobs.length} expired job(s)`);
    } catch (err) {
      console.error("[DeadlineAutoClose] Cycle failed:", err.message);
    }
  }, 60 * 60 * 1000); // Run every hour
};

module.exports = { startDeadlineAutoClose };
