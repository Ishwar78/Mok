const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tathagat_secret_key_2024_dev"
    );

    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (admin.status && admin.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    // attach admin to request
    req.user = {
      id: admin._id,
      role: decoded.role || "admin",
      userType: admin.userType || "admin",
    };

    next();
  } catch (error) {
    console.error("❌ adminAuth error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = adminAuth;
