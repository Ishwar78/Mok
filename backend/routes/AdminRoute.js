const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const adminUserController = require("../controllers/adminUserController");

/* ================== ADMIN AUTH ================== */
// 🔑 ADMIN LOGIN (THIS WAS MISSING)
router.post("/login", adminUserController.adminLogin);

/* ================== ROLE ROUTES ================== */
router.post("/roles", roleController.createRole);
router.get("/roles", roleController.getRoles);
router.put("/roles/:id", roleController.updateRole);
router.delete("/roles/:id", roleController.deleteRole);

/* ================== ADMIN USER ROUTES ================== */
router.post("/admin-users", adminUserController.createAdminUser);
router.get("/admin-users", adminUserController.getAdminUsers);
router.put("/admin-users/:id", adminUserController.updateAdminUser);
router.delete("/admin-users/:id", adminUserController.deleteAdminUser);

router.put(
  "/admin-users/:id/assign-role",
  adminUserController.assignRole
);

router.put(
  "/admin-users/:id/toggle-status",
  adminUserController.toggleStatus
);

module.exports = router;
