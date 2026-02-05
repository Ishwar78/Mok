const mongoose = require("mongoose");
require("dotenv").config();

const Connection = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn("⚠️ MONGO_URI not found in environment variables");
      console.log("📝 Running in development mode without database");
      return;
    }

    await mongoose.connect(mongoUri, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB Atlas Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    console.log("🔄 Continuing without database for development...");
    // Don't exit in development - allow server to run without DB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = Connection;
