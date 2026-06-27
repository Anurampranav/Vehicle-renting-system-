const express = require('express');
const Review  = require('../models/Review');
const Booking = require('../models/Booking');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/reviews ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { bookingId, vehicleId, rating, text } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }
    if (booking.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ success: false, message: 'Already reviewed this booking' });

    const review = await Review.create({
      booking:  bookingId,
      vehicle:  vehicleId,
      customer: req.user._id,
      rating,
      text,
    });
    await review.populate('customer', 'name');
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
});

// ── GET /api/reviews — admin: all ─────────────────────────────────────────
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('customer', 'name email')
      .populate('vehicle',  'name category')
      .sort('-createdAt');
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
});

// ── GET /api/reviews/vehicle/:vehicleId — public ───────────────────────────
router.get('/vehicle/:vehicleId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ vehicle: req.params.vehicleId })
      .populate('customer', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
});

module.exports = router;
