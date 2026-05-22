require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  await db.collection("users").deleteMany({
    email: { $in: ["admin@giunexus.com", "recruiter@test.com", "student@test.com"] }
  });

  const hash = await bcrypt.hash("123456", 10);

  await db.collection("users").insertMany([
    { name: "Admin", email: "admin@giunexus.com", password: hash, role: "admin", status: "approved", createdAt: new Date(), updatedAt: new Date() },
    { name: "Test Recruiter", email: "recruiter@test.com", password: hash, role: "recruiter", status: "approved", createdAt: new Date(), updatedAt: new Date() },
    { name: "Test Student", email: "student@test.com", password: hash, role: "jobSeeker", status: "approved", createdAt: new Date(), updatedAt: new Date() }
  ]);

  console.log("Done! Password for all accounts is: 123456");
  console.log("Recruiter: recruiter@test.com");
  console.log("Admin: admin@giunexus.com");
  console.log("Student: student@test.com");
  process.exit();
}

seed();