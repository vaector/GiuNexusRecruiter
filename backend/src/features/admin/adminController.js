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
  const [usersByRoleRaw, jobsByStatusRaw, appsByStatusRaw, topJobs] =
    await Promise.all([
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
    ]);

  res.status(200).json({
    success: true,
    stats: {
      usersByRole: arrayToCountObject(usersByRoleRaw),
      jobsByStatus: arrayToCountObject(jobsByStatusRaw),
      appsByStatus: arrayToCountObject(appsByStatusRaw),
      topJobs,
    },
  });
});

module.exports = { getPlatformStats };
