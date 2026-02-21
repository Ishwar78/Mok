const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");

/**
 * ⚠️ IMPORTANT FIX
 * authMiddleware file se FUNCTION destructure karo
 * warna Express ko object milta hai → crash
 */
const { authMiddleware } = require("../middleware/authMiddleware");

/* ================= GET LOGGED-IN ADMIN ================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.id === "000000000000000000000000") {
      return res.status(200).json({
        success: true,
        admin: { _id: "000000000000000000000000", fullName: "Super Admin", email: "admin@gmail.com", userType: "superadmin" }
      });
    }

    const admin = await Admin.findById(req.user.id).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= UPDATE PROFILE ================= */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Handle hardcoded fallback user to avoid DB crashing
    if (req.user.id === "000000000000000000000000") {
      return res.status(200).json({
        success: true,
        admin: { fullName: name, phone: phone, email: "admin@gmail.com", userType: "superadmin", profilePic: "" },
        message: "Fallback profile updated locally (not in DB)"
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { fullName: name, phone },
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (err) {
    console.error("UPDATE PROFILE error:", err);
    console.error("req.body:", req.body);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

/* ================= CHANGE PASSWORD ================= */
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong current password" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("CHANGE PASSWORD error:", err);
    res.status(500).json({ message: "Password update failed" });
  }
});

module.exports = router;
