const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MongoDB connection string is missing. Set MONGO_URI.");
  }

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
