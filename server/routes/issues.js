const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const {
  isNonEmptyString,
  isOneOf,
  sanitizeQueryString,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_CATEGORIES
} = require('../utils/validation');

// @route   GET api/issues
// @desc    Get all issues for the user's school with optional filters
// @access  Private
router.get('/', auth, async (req, res) => {
  const filter = { schoolId: req.user.schoolId };

  const status = sanitizeQueryString(req.query.status);
  const priority = sanitizeQueryString(req.query.priority);
  const category = sanitizeQueryString(req.query.category);

  if (status) {
    if (!isOneOf(status, VALID_STATUSES)) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }
    filter.status = status;
  }
  if (priority) {
    if (!isOneOf(priority, VALID_PRIORITIES)) {
      return res.status(400).json({ message: 'Invalid priority filter' });
    }
    filter.priority = priority;
  }
  if (category) {
    if (!isOneOf(category, VALID_CATEGORIES)) {
      return res.status(400).json({ message: 'Invalid category filter' });
    }
    filter.category = category;
  }

  try {
    const { myReports } = req.query;
    if (myReports === 'true') {
      filter.reporter = req.user.id;
    }

    const issues = await db.issues.find(filter);
    res.json(issues);
  } catch (err) {
    console.error('Fetch issues error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/issues/stats
// @desc    Get stats for dashboard charts
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const issues = await db.issues.find({ schoolId: req.user.schoolId });

    const stats = {
      total: issues.length,
      pending: issues.filter(i => i.status === 'pending').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      resolved: issues.filter(i => i.status === 'resolved').length,
      categories: {},
      priorities: {
        low: issues.filter(i => i.priority === 'low').length,
        medium: issues.filter(i => i.priority === 'medium').length,
        high: issues.filter(i => i.priority === 'high').length
      }
    };

    issues.forEach(i => {
      stats.categories[i.category] = (stats.categories[i.category] || 0) + 1;
    });

    res.json(stats);
  } catch (err) {
    console.error('Fetch stats error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/issues/:id
// @desc    Get issue by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const issue = await db.issues.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    if (issue.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied: different school context' });
    }
    res.json(issue);
  } catch (err) {
    console.error('Fetch single issue error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

const validateBase64Image = (base64String) => {
  if (!base64String) return { valid: true };

  const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9+.]+);base64,(.+)$/);
  if (!match) {
    if (typeof base64String === 'string' && /^https?:\/\//i.test(base64String)) {
      return { valid: true };
    }
    return { valid: false, message: 'Invalid image format. Must be a base64 data URI.' };
  }

  const mimeType = match[1].toLowerCase();
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    return { valid: false, message: `Unsupported image type "${mimeType}". Allowed types: JPEG, PNG, WebP.` };
  }

  const base64Data = match[2];
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  const maxSizeBytes = 5 * 1024 * 1024;
  if (sizeInBytes > maxSizeBytes) {
    return { valid: false, message: `Image too large (${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 5 MB.` };
  }

  return { valid: true };
};

// @route   POST api/issues
// @desc    Report a new issue
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, category, location, priority, image } = req.body;

  if (!isNonEmptyString(title, 200) || !isNonEmptyString(description, 2000)
    || !isOneOf(category, VALID_CATEGORIES) || !isNonEmptyString(location, 200)
    || !isOneOf(priority, VALID_PRIORITIES)) {
    return res.status(400).json({ message: 'Please enter all required fields with valid values' });
  }

  const imageValidation = validateBase64Image(image);
  if (!imageValidation.valid) {
    return res.status(400).json({ message: imageValidation.message });
  }

  const finalImage = image || null;

  try {
    const newIssue = await db.issues.create({
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      priority,
      status: 'pending',
      reporter: req.user.id,
      reporterName: req.user.name,
      schoolId: req.user.schoolId,
      image: finalImage,
      timeline: [
        {
          status: 'pending',
          notes: `Issue reported by ${req.user.name} (${req.user.role}).`,
          timestamp: new Date()
        }
      ]
    });

    const admins = await db.users.find({ role: 'admin', schoolId: req.user.schoolId });
    const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
    for (const admin of admins) {
      await db.notifications.create({
        recipient: admin._id,
        message: `New ${priorityLabel}-priority issue reported: "${title.trim()}" at ${location.trim()}.`,
        issueId: newIssue._id
      });
    }

    res.status(201).json(newIssue);
  } catch (err) {
    console.error('Report issue error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/issues/:id
// @desc    Update an issue (status, assignments, timeline)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { status, assignedStaff, estimatedResolutionTime, notes } = req.body;

  if (status && !isOneOf(status, VALID_STATUSES)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }
  if (assignedStaff !== undefined && assignedStaff !== null && !isNonEmptyString(String(assignedStaff), 200)) {
    return res.status(400).json({ message: 'Invalid assigned staff value' });
  }
  if (estimatedResolutionTime !== undefined && estimatedResolutionTime !== null
    && !isNonEmptyString(String(estimatedResolutionTime), 200)) {
    return res.status(400).json({ message: 'Invalid estimated resolution time' });
  }
  if (!isNonEmptyString(notes, 1000)) {
    return res.status(400).json({ message: 'Please provide update notes' });
  }

  try {
    const issue = await db.issues.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (assignedStaff !== undefined) updates.assignedStaff = String(assignedStaff).trim();
    if (estimatedResolutionTime !== undefined) updates.estimatedResolutionTime = String(estimatedResolutionTime).trim();

    const timelineEvent = {
      status: status || issue.status,
      notes: notes.trim(),
      timestamp: new Date()
    };

    const updatedIssue = await db.issues.findByIdAndUpdate(req.params.id, {
      $set: updates,
      $push: { timeline: timelineEvent }
    });

    const statusLabel = (status || issue.status) === 'in-progress' ? 'In Progress' : (status || issue.status);
    await db.notifications.create({
      recipient: issue.reporter,
      message: `Your reported issue "${issue.title}" has been updated to "${statusLabel}". Notes: ${notes.trim()}`,
      issueId: issue._id
    });

    res.json(updatedIssue);
  } catch (err) {
    console.error('Update issue error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
