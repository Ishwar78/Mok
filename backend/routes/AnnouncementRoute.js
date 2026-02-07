const express = require('express');
const router = express.Router();
const {
  upload,
  createAnnouncement,
  getAllAnnouncements,
  getStudentAnnouncements,
  markAsRead,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncementStats
} = require('../controllers/AnnouncementController');

const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware'); // ❗ kept (not deleted)

// ================= OPTIONAL AUTH (STUDENT) =================
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token && token !== 'null' && token !== 'undefined') {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'test_secret_key_for_development'
        );
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    console.log('⚠️ Optional auth failed, proceeding without user:', error.message);
    next();
  }
};

// ================= STUDENT / PUBLIC ROUTES =================
router.get('/student', optionalAuth, getStudentAnnouncements);
router.get('/student/:id', optionalAuth, getAnnouncementById);

// ================= STUDENT AUTH ROUTES =================
router.post('/mark-read/:id', authMiddleware, markAsRead);

// ================= ADMIN ROUTES (FIXED) =================
// ❌ authMiddleware + checkPermission removed from execution
// ✅ adminAuth used

router.post(
  '/admin',
  adminAuth,
  upload.array('attachments', 5),
  createAnnouncement
);

router.get(
  '/admin',
  adminAuth,
  getAllAnnouncements
);

router.get(
  '/admin/stats',
  adminAuth,
  getAnnouncementStats
);

router.get(
  '/admin/:id',
  adminAuth,
  getAnnouncementById
);

router.put(
  '/admin/:id',
  adminAuth,
  updateAnnouncement
);

router.delete(
  '/admin/:id',
  adminAuth,
  deleteAnnouncement
);

module.exports = router;
