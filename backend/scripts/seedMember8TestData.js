const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../src/features/user/User");
const JobPost = require("../src/features/job-posts/JobPost");
const Application = require("../src/features/application/Application");

const SEEKER_EMAIL = "member8.seeker@test.com";
const RECRUITER_EMAIL = "member8.recruiter@test.com";
const JOB_TITLE = "Member 8 Backend Intern Test Job";
const JOB_COMPANY = "GIU Nexus Test Company";

const buildToken = (user) => {
  const userId = user._id.toString();

  return jwt.sign(
    {
      id: userId,
      _id: userId,
      userId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

const cleanupSeedData = async () => {
  const seedUsers = await User.find({
    email: { $in: [SEEKER_EMAIL, RECRUITER_EMAIL] },
  }).select("_id");
  const seedUserIds = seedUsers.map((user) => user._id);

  const seedJobs = await JobPost.find({
    title: JOB_TITLE,
    company: JOB_COMPANY,
  }).select("_id");
  const seedJobIds = seedJobs.map((job) => job._id);

  const applicationFilters = [];

  if (seedUserIds.length > 0) {
    applicationFilters.push({ user: { $in: seedUserIds } });
  }

  if (seedJobIds.length > 0) {
    applicationFilters.push({ job: { $in: seedJobIds } });
  }

  if (applicationFilters.length > 0) {
    await Application.deleteMany({ $or: applicationFilters });
  }

  await JobPost.deleteMany({
    title: JOB_TITLE,
    company: JOB_COMPANY,
  });
  await User.deleteMany({
    email: { $in: [SEEKER_EMAIL, RECRUITER_EMAIL] },
  });
};

const main = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error(
        "MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI in backend/.env."
      );
      process.exitCode = 1;
      return;
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing. Set JWT_SECRET in backend/.env.");
      process.exitCode = 1;
      return;
    }

    await mongoose.connect(mongoUri, {
      family: 4,
    });

    await cleanupSeedData();

    const jobSeeker = await User.create({
      name: "Member 8 Test Seeker",
      email: SEEKER_EMAIL,
      password: "123456",
      role: "jobSeeker",
      status: "approved",
      bio: "I know React, Node.js, Express, MongoDB, and REST APIs.",
      skills: ["React", "Node.js", "Express", "MongoDB"],
    });

    const recruiter = await User.create({
      name: "Member 8 Test Recruiter",
      email: RECRUITER_EMAIL,
      password: "123456",
      role: "recruiter",
      status: "approved",
    });

    const job = await JobPost.create({
      title: JOB_TITLE,
      company: JOB_COMPANY,
      description:
        "Backend internship using Node.js, Express, MongoDB, and REST APIs.",
      requirements: ["Node.js", "Express", "MongoDB", "REST APIs"],
      location: "Cairo",
      type: "internship",
      status: "open",
      category: "Backend",
      createdBy: recruiter._id,
    });

    const application = await Application.create({
      user: jobSeeker._id,
      job: job._id,
      coverLetter: "I am interested in this backend internship.",
      status: "pending",
      appliedAt: new Date(),
    });

    const jobSeekerToken = buildToken(jobSeeker);
    const recruiterToken = buildToken(recruiter);

    console.log("=== MEMBER 8 POSTMAN TEST DATA ===");
    console.log("BASE_URL=http://localhost:5000/api/v1");
    console.log(`JOB_SEEKER_TOKEN=${jobSeekerToken}`);
    console.log(`RECRUITER_TOKEN=${recruiterToken}`);
    console.log(`JOB_ID=${job._id.toString()}`);
    console.log(`APP_ID=${application._id.toString()}`);
    console.log(`SEEKER_ID=${jobSeeker._id.toString()}`);
    console.log(`RECRUITER_ID=${recruiter._id.toString()}`);
    console.log("===========================");
    console.log("");
    console.log("Postman requests:");
    console.log(
      "GET {{BASE_URL}}/applications/my with JOB_SEEKER_TOKEN"
    );
    console.log(
      "GET {{BASE_URL}}/jobs/{{JOB_ID}}/applicants with RECRUITER_TOKEN"
    );
    console.log(
      'PATCH {{BASE_URL}}/applications/{{APP_ID}}/status with RECRUITER_TOKEN and body { "status": "shortlisted" }'
    );
  } catch (error) {
    process.exitCode = 1;
    console.error("Failed to seed Member 8 test data:", error.message);
    console.error(error.stack);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

main();
