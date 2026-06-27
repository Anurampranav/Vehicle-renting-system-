const express     = require('express');
const Booking     = require('../models/Booking');
const Vehicle     = require('../models/Vehicle');
const User        = require('../models/User');
const Payment     = require('../models/Payment');
const Ticket      = require('../models/Ticket');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/admin/stats ───────────────────────────────────────────────────
router.get('/stats', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);   // first of month
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last of month

    const [
      totalVehicles, activeBookings, totalCustomers,
      monthPayments, openTickets,
      recentBookings, earningsByVehicle,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Booking.countDocuments({ status: { $in: ['Confirmed', 'Active'] } }),
      User.countDocuments({ role: 'customer' }),
      Payment.find({ status: 'Completed', createdAt: { $gte: start, $lte: end } }),
      Ticket.countDocuments({ status: 'Open' }),
      Booking.find()
        .populate('customer', 'name email')
        .populate('vehicle',  'name category')
        .sort('-createdAt')
        .limit(5),
      Booking.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: '$vehicle', totalRevenue: { $sum: '$total' }, count: { $sum: 1 } } },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: '$vehicle' },
        { $project: { vehicleName: '$vehicle.name', totalRevenue: 1, count: 1 } },
        { $sort: { totalRevenue: -1 } },
      ]),
    ]);

    const monthRevenue = monthPayments.reduce((s, p) => s + p.amount, 0);

    // Year revenue
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearPayments = await Payment.find({ status: 'Completed', createdAt: { $gte: yearStart } });
    const yearRevenue  = yearPayments.reduce((s, p) => s + p.amount, 0);

    // All time
    const allPayments = await Payment.find({ status: 'Completed' });
    const allRevenue  = allPayments.reduce((s, p) => s + p.amount, 0);

    res.json({
      success: true,
      data: {
        totalVehicles, activeBookings, totalCustomers,
        monthRevenue, yearRevenue, allRevenue,
        openTickets,
        recentBookings,
        earningsByVehicle,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/admin/customers ───────────────────────────────────────────────
router.get('/customers', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer' }).sort('-createdAt');
    const bookings  = await Booking.find({ status: { $ne: 'Cancelled' } });

    const result = customers.map(c => {
      const ub    = bookings.filter(b => b.customer.toString() === c._id.toString());
      const spent = ub.reduce((s, b) => s + b.total, 0);
      return { ...c.toJSON(), bookingCount: ub.length, totalSpent: spent };
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
