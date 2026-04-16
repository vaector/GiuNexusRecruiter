const mongoose = require("mongoose");

const buildConnectionString = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const { DB_USER, DB_PASSWORD, DB_CLUSTER, DB_NAME, DB_PARAMS } = process.env;
  if (!DB_USER || !DB_PASSWORD || !DB_CLUSTER || !DB_NAME) {
    throw new Error(
      "MongoDB connection settings are missing in .env. Set MONGODB_URI or DB_USER, DB_PASSWORD, DB_CLUSTER, and DB_NAME."
    );
  }

  const params = DB_PARAMS || "retryWrites=true&w=majority";
  return `mongodb+srv://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_CLUSTER}/${DB_NAME}?${params}`;
};

const connectDB = async () => {
  const uri = buildConnectionString();

  try {
    await mongoose.connect(uri, {
      family: 4,
    });
    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message || error);
    throw error;
  }
};

module.exports = connectDB;
