require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const User = require("./backend/src/features/user/User");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

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
