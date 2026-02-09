const AdminUser = require("../models/AdminUser");

/* =====================================================
   CHECK PERMISSION MIDDLEWARE
   ===================================================== */
const checkPermission = (moduleKey, action) => {
  return async (req, res, next) => {
    try {
      /* ---------- AUTH CHECK ---------- */
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      /* ---------- SUPERADMIN BYPASS ---------- */
      if (req.user.userType === "superadmin") {
        return next();
      }

      /* ---------- FETCH ADMIN USER ---------- */
      const adminUser = await AdminUser.findById(req.user.id)
        .populate("role");

      if (!adminUser) {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      /* ---------- ACCOUNT STATUS ---------- */
      if (adminUser.status === "suspended") {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended"
        });
      }

      /* ---------- ROLE CHECK ---------- */
      if (!adminUser.role) {
        return res.status(403).json({
          success: false,
          message: "No role assigned"
        });
      }

      const permissions = adminUser.role.permissions || {};

      /* ---------- MODULE CHECK ---------- */
      if (!permissions[moduleKey]) {
        return res.status(403).json({
          success: false,
          message: "Permission denied"
        });
      }

      /* ---------- ACTION CHECK ---------- */
      if (!permissions[moduleKey][action]) {
        return res.status(403).json({
          success: false,
          message: `Access denied: ${action} permission required`
        });
      }

      /* ---------- ATTACH PERMISSIONS ---------- */
      req.permissions = permissions;
      next();

    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Permission verification failed"
      });
    }
  };
};

/* =====================================================
   REQUIRE SUPER ADMIN
   ===================================================== */
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (req.user.userType === "superadmin") {
      return next();
    }

    const adminUser = await AdminUser.findById(req.user.id);

    if (!adminUser || adminUser.userType !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Super Admin access required"
      });
    }

    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    return res.status(500).json({
      success: false,
      message: "Permission verification failed"
    });
  }
};

module.exports = {
  checkPermission,
  requireSuperAdmin
};
