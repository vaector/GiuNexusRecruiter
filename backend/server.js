

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

require("./src/features/referrals/userReferralExtension");

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/features/auth/authRoutes");
const userRoutes = require("./src/features/user/userRoutes");
const jobRoutes = require("./src/features/jobPost/jobRoutes");
const applicationRoutes = require("./src/features/application/applicationRoutes");
const messageRoutes = require("./src/features/messaging/messageRoutes");
const profileRoutes = require("./src/features/profile/profileRoutes");
const adminRoutes = require("./src/features/admin/adminRoutes");
const referralRoutes = require("./src/features/referrals/referralRoutes");
const errorHandler = require("./src/middleware/errorHandler");
const requestLogger = require("./src/middleware/requestLogger");
const notificationRoutes = require("./src/features/notification/notificationRoutes");
const savedSearchRoutes = require("./src/features/savedSearch/savedRoutes");
const { startSavedSearchPoller } = require("./src/features/savedSearch/savedPoller");
const reportRoutes = require("./src/features/reports/reportsRoutes");
const documentRoutes = require("./src/features/document/documentRoutes");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/conversations", messageRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use('/api/v1/saved-searches', savedSearchRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use("/api/v1/referrals", referralRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
      startSavedSearchPoller();
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
