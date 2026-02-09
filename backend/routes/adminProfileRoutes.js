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

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ success: true, admin });
  } catch (err) {
    console.error("UPDATE PROFILE error:", err);
    res.status(500).json({ message: "Update failed" });
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
