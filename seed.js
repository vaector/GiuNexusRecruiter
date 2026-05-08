require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const User = require("./backend/src/features/user/User");

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI.");
  }

  await mongoose.connect(mongoUri);

  await User.create({
    name: "Admin",
    email: "admin@giunexus.com",
    password: "adminpassword123",
    role: "admin",
    status: "approved",
  });

  console.log("Admin created!");
  process.exit();
}

seed();
