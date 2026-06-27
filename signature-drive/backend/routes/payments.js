const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── POST /api/payments/create-order ────────────────────────────────────────
router.post('/create-order', protect, async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('vehicle', 'name')
      .populate('customer', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    if (booking.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    const amount = Math.round(booking.total * 100); // Razorpay expects amount in paise

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${booking._id}`.slice(0, 40),
      notes: {
        bookingId: booking._id.toString(),
        customerId: req.user._id.toString(),
        vehicleName: booking.vehicle.name,
      },
    });

    const payment = await Payment.create({
      booking: booking._id,
      customer: req.user._id,
      amount: booking.total,
      method: booking.paymentMethod || 'Card',
      status: 'Pending',
      razorpayOrderId: order.id,
      transactionDate: new Date(),
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking._id,
      paymentId: payment._id,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payments/verify ───────────────────────────────────────────────
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isValid = generatedSignature === razorpaySignature;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access forbidden' });
    }

    if (isValid) {
      payment.status = 'Completed';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paymentStatus = 'success';
      await payment.save();

      const booking = await Booking.findById(payment.booking);
      if (booking) {
        booking.status = 'Paid';
        await booking.save();
      }

      return res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      payment.status = 'Failed';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      payment.paymentStatus = 'failed';
      await payment.save();

      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /api/payments — admin: all ────────────────────────────────────────
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('customer', 'name email')
      .populate({ path: 'booking', populate: { path: 'vehicle', select: 'name' } })
      .sort('-createdAt');
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) { next(err); }
});

// ── GET /api/payments/my ───────────────────────────────────────────────────
router.get('/my', protect, async (req, res, next) => {
  try {
    const payments = await Payment.find({ customer: req.user._id })
      .populate({ path: 'booking', populate: { path: 'vehicle', select: 'name' } })
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (err) { next(err); }
});

// ── POST /api/payments/:id/refund — admin ─────────────────────────────────
router.post('/:id/refund', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.status === 'Refunded') return res.status(400).json({ success: false, message: 'Already refunded' });

    payment.status       = 'Refunded';
    payment.refundAmount = req.body.amount || payment.amount;
    payment.refundReason = req.body.reason || '';
    payment.refundedAt   = new Date();
    await payment.save();

    res.json({ success: true, data: payment });
  } catch (err) { next(err); }
});

module.exports = router;
