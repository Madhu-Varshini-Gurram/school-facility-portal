const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await db.notifications.find({ recipient: req.user.id });
    res.json(notifications);
  } catch (err) {
    console.error('Fetch notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/notifications/read/all
// @desc    Mark all notifications as read for current user
// @access  Private
router.put('/read/all', auth, async (req, res) => {
  try {
    const list = await db.notifications.find({ recipient: req.user.id, read: false });
    const updated = [];
    for (const item of list) {
      const u = await db.notifications.findByIdAndUpdate(item._id, { read: true });
      updated.push(u);
    }
    res.json({ message: 'All notifications marked as read', count: updated.length });
  } catch (err) {
    console.error('Mark all notifications read error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/notifications/:id
// @desc    Mark a notification as read
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const notification = await db.notifications.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (String(notification.recipient) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied: this notification does not belong to you.' });
    }
    const updated = await db.notifications.findByIdAndUpdate(req.params.id, { read: true });
    res.json(updated);
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
