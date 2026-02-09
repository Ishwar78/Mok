const express = require("express");
const router = express.Router();
const AdminUser = require("../models/AdminUser");
const { adminAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/permissionMiddleware");
const jwt = require("jsonwebtoken");

/* ========================= LOGIN (NO AUTH) ========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AdminUser.findOne({
      email: email.toLowerCase()
    }).populate("role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Account suspended"
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      {
        id: user._id,
        userType: user.userType,
        email: user.email,
        name: user.fullName
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        status: user.status,
        role: user.role
      },
      permissions: user.role?.permissions || {}
    });

  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

/* ========================= GET ALL ADMIN USERS ========================= */
router.get(
  "/",
  adminAuth,
  checkPermission("roleManagement", "view"),
  async (req, res) => {
    try {
      const users = await AdminUser.find()
        .select("-password")
        .populate("role");

      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch users"
      });
    }
  }
);

/* ========================= GET LOGGED-IN USER ========================= */
router.get("/me", adminAuth, async (req, res) => {
  try {
    const user = await AdminUser.findById(req.user.id)
      .select("-password")
      .populate("role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user,
      permissions: user.role?.permissions || {}
    });
  } catch (err) {
    console.error("Fetch /me error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
});

module.exports = router;
