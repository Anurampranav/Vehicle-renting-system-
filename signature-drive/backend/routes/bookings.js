const express = require('express');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/bookings ─────────────────────────────────────────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { vehicleId, pickupDate, returnDate, location, paymentMethod } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle)           return res.status(404).json({ success: false, message: 'Vehicle not found' });
    if (!vehicle.available) return res.status(400).json({ success: false, message: 'Vehicle is not available' });

    const p = new Date(pickupDate);
    const r = new Date(returnDate);
    if (r <= p) return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });

    // Overlap check
    const overlap = await Booking.findOne({
      vehicle: vehicleId,
      status:  { $in: ['Confirmed', 'Active'] },
      $or: [
        { pickupDate: { $lt: r }, returnDate: { $gt: p } },
      ],
    });
    if (overlap) return res.status(400).json({ success: false, message: 'Vehicle already booked for those dates' });

    const days     = Math.ceil((r - p) / (1000 * 60 * 60 * 24));
    const subtotal = vehicle.pricePerDay * days;
    const tax      = Math.round(subtotal * 0.18);
    const total    = subtotal + tax;

    const booking = await Booking.create({
      customer:    req.user._id,
      vehicle:     vehicleId,
      pickupDate:  p,
      returnDate:  r,
      days,
      location,
      pricePerDay: vehicle.pricePerDay,
      subtotal,
      tax,
      total,
      paymentMethod,
      status: 'Confirmed',
    });

    // Create payment record with Pending status for online payments (Razorpay will complete them)
    await Payment.create({
      booking:       booking._id,
      customer:      req.user._id,
      amount:        total,
      method:        paymentMethod,
      status:        paymentMethod === 'Cash' ? 'Pending' : 'Pending',
      transactionId: 'TXN' + Date.now(),
    });

    const populated = await booking.populate([
      { path: 'vehicle', select: 'name category icon pricePerDay' },
      { path: 'customer', select: 'name email phone' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// ── GET /api/bookings/my ───────────────────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('vehicle', 'name category icon fuel transmission seats')
      .sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});

// ── GET /api/bookings — admin: all bookings ────────────────────────────────
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name category')
      .sort('-createdAt');

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) { next(err); }
});

// ── GET /api/bookings/:id ──────────────────────────────────────────────────
router.get('/:id', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('vehicle',  'name category icon pricePerDay location');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Customers can only view their own
    if (req.user.role !== 'admin' && booking.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// ── PATCH /api/bookings/:id/cancel ────────────────────────────────────────
router.patch('/:id/cancel', protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isOwner = booking.customer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }
    if (!['Confirmed', 'Active'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status       = 'Cancelled';
    booking.cancelReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// ── PATCH /api/bookings/:id/status — admin only ────────────────────────────
router.patch('/:id/status', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['Confirmed', 'Active', 'Completed', 'Cancelled', 'Paid'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('customer', 'name email')
      .populate('vehicle',  'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
});

module.exports = router;
