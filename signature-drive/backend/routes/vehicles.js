const express = require('express');
const Vehicle = require('../models/Vehicle');
const Review  = require('../models/Review');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/vehicles ──────────────────────────────────────────────────────
// Public — supports ?category=SUV&location=Bengaluru&maxPrice=1000&available=true
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category)  filter.category = req.query.category;
    if (req.query.location)  filter.location = new RegExp(req.query.location, 'i');
    if (req.query.available) filter.available = req.query.available === 'true';
    if (req.query.maxPrice)  filter.pricePerDay = { $lte: Number(req.query.maxPrice) };

    const vehicles = await Vehicle.find(filter).lean();

    // Attach average ratings
    const ids = vehicles.map(v => v._id);
    const reviews = await Review.aggregate([
      { $match: { vehicle: { $in: ids } } },
      { $group: { _id: '$vehicle', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const ratingMap = {};
    reviews.forEach(r => { ratingMap[r._id.toString()] = { avg: r.avg.toFixed(1), count: r.count }; });

    const result = vehicles.map(v => ({
      ...v,
      rating: ratingMap[v._id.toString()] || null,
    }));

    res.json({ success: true, count: result.length, data: result });
  } catch (err) { next(err); }
});

// ── GET /api/vehicles/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).lean();
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const reviews = await Review.find({ vehicle: vehicle._id })
      .populate('customer', 'name')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, data: { ...vehicle, reviews } });
  } catch (err) { next(err); }
});

// ── POST /api/vehicles ─────────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// ── PUT /api/vehicles/:id ──────────────────────────────────────────────────
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// ── PATCH /api/vehicles/:id/availability ──────────────────────────────────
router.patch('/:id/availability', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    vehicle.available = !vehicle.available;
    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (err) { next(err); }
});

// ── DELETE /api/vehicles/:id ───────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
