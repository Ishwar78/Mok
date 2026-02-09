const express = require('express');
const router = express.Router();

const {
  createDiscussion,
  getPublishedDiscussions,
  getDiscussionById,
  addReply,
  voteDiscussion,
  getUserDiscussions
} = require('../controllers/DiscussionController');

const { authMiddleware, adminAuth } = require('../middleware/authMiddleware');
const Discussion = require('../models/Discussion');
const DiscussionReply = require('../models/DiscussionReply');

// ================= STUDENT ROUTES =================
router.post('/create', authMiddleware, createDiscussion);
router.get('/published', getPublishedDiscussions);
router.get('/my-discussions', authMiddleware, getUserDiscussions);
router.get('/:id', getDiscussionById);
router.post('/:discussionId/reply', authMiddleware, addReply);
router.post('/:id/vote', authMiddleware, voteDiscussion);

// ================= ADMIN ROUTES =================

// 🔹 Get all discussions (admin)
router.get('/admin/discussions', adminAuth, async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate('askedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, discussions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch discussions' });
  }
});

// 🔹 Moderate discussion (approve / reject / publish / pin)
router.put('/admin/discussions/:id/moderate', adminAuth, async (req, res) => {
  try {
    const { action, moderationNote } = req.body;

    const updates = {};
    if (action === 'approve') updates.status = 'approved';
    if (action === 'reject') updates.status = 'rejected';
    if (action === 'publish') updates.isPublished = true;
    if (action === 'unpublish') updates.isPublished = false;
    if (action === 'pin') updates.isPinned = true;
    if (action === 'unpin') updates.isPinned = false;

    updates.moderatedAt = new Date();
    updates.moderationNote = moderationNote;

    const discussion = await Discussion.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({ success: true, discussion });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Moderation failed' });
  }
});

// 🔹 Delete discussion
router.delete('/admin/discussions/:id', adminAuth, async (req, res) => {
  try {
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 🔹 Admin stats
router.get('/admin/discussions/stats', adminAuth, async (req, res) => {
  try {
    const total = await Discussion.countDocuments();
    const pending = await Discussion.countDocuments({ status: 'pending' });
    const approved = await Discussion.countDocuments({ status: 'approved' });

    res.json({
      success: true,
      stats: { total, pending, approved }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ================= ADMIN REPLIES =================

// 🔹 Get all replies
router.get('/admin/replies', adminAuth, async (req, res) => {
  try {
    const replies = await DiscussionReply.find()
      .populate('repliedBy', 'name')
      .populate('discussionId', 'title');

    res.json({ success: true, replies });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 🔹 Moderate reply
router.put('/admin/replies/:id/moderate', adminAuth, async (req, res) => {
  try {
    const { action } = req.body;

    const updates = {};
    if (action === 'approve') updates.status = 'approved';
    if (action === 'reject') updates.status = 'rejected';
    if (action === 'mark_best') updates.isBestAnswer = true;
    if (action === 'unmark_best') updates.isBestAnswer = false;

    const reply = await DiscussionReply.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 🔹 Delete reply
router.delete('/admin/replies/:id', adminAuth, async (req, res) => {
  try {
    await DiscussionReply.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
