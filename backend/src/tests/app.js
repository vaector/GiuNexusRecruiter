// Express app for tests — identical to server.js setup but without connectDB / listen.
// The test suite's setup.js connects mongoose to mongodb-memory-server before tests run.
process.env.NODE_ENV = "test";
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-jwt-secret-256-bit-key-for-testing-only";
if (!process.env.JWT_EXPIRE) process.env.JWT_EXPIRE = "1d";

const express = require("express");
const cors = require("cors");

const authRoutes = require("../features/auth/authRoutes");
const userRoutes = require("../features/user/userRoutes");
const jobRoutes = require("../features/job-posts/jobRoutes");
const applicationRoutes = require("../features/application/applicationRoutes");
const profileRoutes = require("../features/profile/profileRoutes");
const adminRoutes = require("../features/admin/adminRoutes");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use(errorHandler);

module.exports = app;
