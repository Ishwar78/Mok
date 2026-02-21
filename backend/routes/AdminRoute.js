const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const adminUserController = require("../controllers/adminUserController");
const { adminAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

/* ================== ADMIN AUTH ================== */
// ✅ FIXED: adminLogin (not loginAdmin)
if (typeof adminUserController.adminLogin === "function") {
  router.post("/login", adminUserController.adminLogin);
}

/* ================== ADMIN PROFILE ================== */
if (typeof adminUserController.getProfile === "function") {
  router.get("/me", adminAuth, adminUserController.getProfile);
}

if (typeof adminUserController.updateProfile === "function") {
  router.put("/profile", adminAuth, adminUserController.updateProfile);
}

if (typeof adminUserController.uploadProfilePic === "function") {
  router.post(
    "/upload-profile",
    adminAuth,
    upload.single("profilePic"),
    adminUserController.uploadProfilePic
  );
}

if (typeof adminUserController.changePassword === "function") {
  router.put(
    "/change-password",
    adminAuth,
    adminUserController.changePassword
  );
}

/* ================== ROLE ROUTES ================== */
// Removed: These are properly handled in roleRoutes.js


/* ================== ADMIN USER ROUTES ================== */
if (typeof adminUserController.createAdminUser === "function") {
  router.post("/admin-users", adminUserController.createAdminUser);
}

if (typeof adminUserController.getAdminUsers === "function") {
  router.get("/admin-users", adminUserController.getAdminUsers);
}

if (typeof adminUserController.updateAdminUser === "function") {
  router.put("/admin-users/:id", adminUserController.updateAdminUser);
}

if (typeof adminUserController.deleteAdminUser === "function") {
  router.delete("/admin-users/:id", adminUserController.deleteAdminUser);
}

if (typeof adminUserController.assignRole === "function") {
  router.put("/admin-users/:id/assign-role", adminUserController.assignRole);
}

if (typeof adminUserController.toggleStatus === "function") {
  router.put("/admin-users/:id/toggle-status", adminUserController.toggleStatus);
}

module.exports = router;
