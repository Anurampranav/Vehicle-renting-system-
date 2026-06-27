const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── POST /api/auth/setup-admin ───────────────────────────────────────────────
router.post('/setup-admin', async (req, res, next) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.json({ success: true, message: 'Admin already exists', admin: existing.email });
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin Owner',
      email: 'admin@sdr.in',
      phone: '+91 98765 00000',
      password: hashedPassword,
      role: 'admin',
    });
    
    res.status(201).json({ success: true, message: 'Admin created', admin: admin.email });
  } catch (err) { next(err); }
});

// ── POST /api/auth/register ────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user  = await User.create({ name, email, phone, password, role: 'customer' });
    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user });
  } catch (err) { next(err); }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // Role guard — if frontend sends expected role
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Not a ${role} account` });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── PATCH /api/auth/me ─────────────────────────────────────────────────────
router.patch('/me', protect, async (req, res, next) => {
  try {
    const allowed = ['name', 'phone'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

module.exports = router;
