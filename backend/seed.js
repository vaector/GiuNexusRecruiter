require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./src/features/user/User");

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI.");
  }

  await mongoose.connect(mongoUri);

  await User.create([
    {
      name: "Admin",
      email: "admin@giunexus.com",
      password: "adminpassword123",
      role: "admin",
      status: "approved",
    },
    {
      name: "Job Seeker",
      email: "seeker@test.com",
      password: "seeker123",
      role: "jobSeeker",
      status: "approved",
    },
    {
      name: "Recruiter",
      email: "recruiter@test.com",
      password: "recruiter123",
      role: "recruiter",
      status: "approved",
    },
  ]);

  console.log("Seeded users:");
  console.log("  Admin      — admin@giunexus.com / adminpassword123");
  console.log("  Job Seeker  — seeker@test.com / seeker123");
  console.log("  Recruiter   — recruiter@test.com / recruiter123");
  process.exit();
}

seed();
