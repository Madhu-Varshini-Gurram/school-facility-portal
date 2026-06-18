const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const auth = require('../middleware/auth');
const { isNonEmptyString, isEmail, isOneOf, VALID_ROLES, isStrongPassword } = require('../utils/validation');

const signToken = (payload) => new Promise((resolve, reject) => {
  jwt.sign(payload, auth.getJwtSecret(), { expiresIn: '7d' }, (err, token) => {
    if (err) reject(err);
    else resolve(token);
  });
});

const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  schoolId: user.schoolId
});

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, schoolId } = req.body;

  if (!isNonEmptyString(name, 100) || !isEmail(email) || !isNonEmptyString(password, 128)
    || !isOneOf(role, VALID_ROLES) || !isNonEmptyString(schoolId, 50)) {
    return res.status(400).json({ message: 'Please provide valid name, email, password, role, and school ID' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await db.users.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'Unable to create account with these details' });
    }

    if (role === 'admin') {
      const adminExists = await db.users.findOne({ role: 'admin', schoolId: schoolId.trim() });
      if (adminExists) {
        return res.status(400).json({ message: 'An administrator already exists for this school' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.users.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      schoolId: schoolId.trim()
    });

    const payload = {
      id: newUser._id,
      name: newUser.name,
      role: newUser.role,
      schoolId: newUser.schoolId
    };

    const token = await signToken(payload);
    res.json({ token, user: buildUserResponse(newUser) });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!isEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Please enter a valid email and password' });
  }

  try {
    const user = await db.users.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user._id,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId
    };

    const token = await signToken(payload);
    res.json({ token, user: buildUserResponse(user) });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await db.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Me query error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Reset password by verifying email and school ID
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email, schoolId, newPassword } = req.body;

  if (!isEmail(email) || !isNonEmptyString(schoolId, 50) || !isNonEmptyString(newPassword, 128)) {
    return res.status(400).json({ message: 'Please provide valid email, school ID, and new password' });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.users.findOne({ email: normalizedEmail, schoolId: schoolId.trim() });

    if (!user) {
      return res.status(400).json({ message: 'No matching account found with these details' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.users.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
