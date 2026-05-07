require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./backend/src/features/user/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const hashed = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Admin",
    email: "admin@giu.edu",
    password: hashed,
    role: "admin",
    status: "approved",
  });

  console.log("Admin created!");
  process.exit();
}

seed();
