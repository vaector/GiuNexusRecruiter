const asyncHandler = require("../../middleware/asyncHandler");
const User = require("../user/User");
const JobPost = require("../job-posts/JobPost");
const Application = require("../application/Application");

const arrayToCountObject = (arr) =>
  arr.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

// GET /api/v1/admin/stats — admin only
const getPlatformStats = asyncHandler(async (req, res) => {
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const [
    usersByRoleRaw,
    jobsByStatusRaw,
    appsByStatusRaw,
    topJobs,
    appsPerWeek,
    jobsPerWeek,
    usersPerWeek,
    topRecruiters,
    applicationStatusTrend,
    avgApplicationsPerJobRaw,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    JobPost.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Application.aggregate([
      { $group: { _id: "$job", applicationCount: { $sum: 1 } } },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "jobposts",
          localField: "_id",
          foreignField: "_id",
          as: "jobInfo",
        },
      },
      { $unwind: "$jobInfo" },
      {
        $project: {
          _id: "$jobInfo._id",
          title: "$jobInfo.title",
          company: "$jobInfo.company",
          applicationCount: 1,
        },
      },
    ]),
    Application.aggregate([
      { $match: { appliedAt: { $gte: twentyEightDaysAgo } } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$appliedAt" },
            year: { $isoWeekYear: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),
    JobPost.aggregate([
      { $match: { createdAt: { $gte: twentyEightDaysAgo } } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            year: { $isoWeekYear: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: twentyEightDaysAgo } } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$createdAt" },
            year: { $isoWeekYear: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]),
    User.aggregate([
      { $match: { role: "recruiter" } },
      {
        $lookup: {
          from: "jobposts",
          localField: "_id",
          foreignField: "createdBy",
          as: "jobs",
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "jobs._id",
          foreignField: "job",
          as: "receivedApplications",
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          applicationCount: { $sum: { $size: "$receivedApplications" } },
        },
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 5 },
      { $project: { name: 1, email: 1, applicationCount: 1 } },
    ]),
    Application.aggregate([
      { $match: { appliedAt: { $gte: twentyEightDaysAgo } } },
      {
        $group: {
          _id: {
            status: "$status",
            week: { $isoWeek: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.week": 1 } },
    ]),
    Application.aggregate([
      { $group: { _id: "$job", appCount: { $sum: 1 } } },
      { $group: { _id: null, avgApplicationsPerJob: { $avg: "$appCount" } } },
      { $project: { _id: 0, avgApplicationsPerJob: 1 } },
    ]),
  ]);

  const avgApplicationsPerJob = avgApplicationsPerJobRaw[0]?.avgApplicationsPerJob ?? 0;

  res.status(200).json({
    success: true,
    stats: {
      usersByRole: arrayToCountObject(usersByRoleRaw),
      jobsByStatus: arrayToCountObject(jobsByStatusRaw),
      appsByStatus: arrayToCountObject(appsByStatusRaw),
      topJobs,
      topRecruiters,
      applicationStatusTrend,
      avgApplicationsPerJob,
    },
    timeSeries: {
      appsPerWeek,
      jobsPerWeek,
      usersPerWeek,
    },
  });
});

module.exports = { getPlatformStats };
