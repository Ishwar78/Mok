const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const adminUserController = require("../controllers/adminUserController");

/* ================== ADMIN AUTH ================== */
// 🔑 ADMIN LOGIN (THIS WAS MISSING)
router.post("/login", adminUserController.adminLogin);

/* ================== ROLE ROUTES ================== */
if (roleController && roleController.createRole) {
  router.post("/roles", roleController.createRole);
  router.get("/roles", roleController.getRoles);
  if (roleController.updateRole) router.put("/roles/:id", roleController.updateRole);
  router.delete("/roles/:id", roleController.deleteRole);
}

/* ================== ADMIN USER ROUTES ================== */
if (adminUserController && adminUserController.createAdminUser) {
  router.post("/admin-users", adminUserController.createAdminUser);
  router.get("/admin-users", adminUserController.getAdminUsers);
  if (adminUserController.updateAdminUser) router.put("/admin-users/:id", adminUserController.updateAdminUser);
  if (adminUserController.deleteAdminUser) router.delete("/admin-users/:id", adminUserController.deleteAdminUser);

  if (adminUserController.assignRole) {
    router.put(
      "/admin-users/:id/assign-role",
      adminUserController.assignRole
    );
  }

  if (adminUserController.toggleStatus) {
    router.put(
      "/admin-users/:id/toggle-status",
      adminUserController.toggleStatus
    );
  }
}

module.exports = router;
