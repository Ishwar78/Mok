const express = require("express");
const router = express.Router();
const AdminUser = require("../models/AdminUser");
const { adminAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/permissionMiddleware");
const jwt = require("jsonwebtoken");

/* ========================= LOGIN (NO AUTH HERE) ========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AdminUser.findOne({ email: email.toLowerCase() }).populate("role");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Account suspended" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const permissions = await user.getEffectivePermissions();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.userType === "superadmin" ? "admin" : "subadmin",
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
        status: user.status
      },
      permissions
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

/* ========================= PROTECTED ROUTES ========================= */

router.get("/", adminAuth, checkPermission("roleManagement", "view"), async (req, res) => {
  const users = await AdminUser.find().select("-password");
  res.json({ success: true, users });
});

router.get("/me", adminAuth, async (req, res) => {
  const user = await AdminUser.findById(req.user.id).select("-password");
  const permissions = await user.getEffectivePermissions();
  res.json({ success: true, user, permissions });
});

module.exports = router;
