require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./backend/src/features/user/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.create({
    name: "Admin",
    email: "admin@giu.edu",
    password: "admin123",
    role: "admin",
    status: "approved",
  });

  console.log("Admin created!");
  process.exit();
}

seed();
