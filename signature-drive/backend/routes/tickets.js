const express = require('express');
const Ticket  = require('../models/Ticket');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/tickets ──────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerEmail, category, bookingRef, subject, message, priority } = req.body;
    if (!customerName || !customerEmail || !category || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    // Attach user if logged in (optional auth)
    let customerId = null;
    try {
      const auth = req.headers.authorization;
      if (auth && auth.startsWith('Bearer ')) {
        const jwt  = require('jsonwebtoken');
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        customerId = decoded.id;
      }
    } catch (_) {}

    const ticket = await Ticket.create({
      customer: customerId,
      customerName, customerEmail, category,
      bookingRef, subject, message,
      priority: priority || 'Low',
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// ── GET /api/tickets/my — logged-in customer's tickets ────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
});

// ── GET /api/tickets — admin: all ─────────────────────────────────────────
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) { next(err); }
});

// ── PATCH /api/tickets/:id/reply — admin ──────────────────────────────────
router.patch('/:id/reply', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { text, status } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Reply text required' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.replies.push({ text, by: req.user.name || 'Support Team' });
    if (status) ticket.status = status;
    ticket.updatedAt = new Date();
    await ticket.save();

    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

// ── PATCH /api/tickets/:id/status — admin ─────────────────────────────────
router.patch('/:id/status', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

module.exports = router;
