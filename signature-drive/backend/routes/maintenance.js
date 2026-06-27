const express     = require('express');
const Maintenance = require('../models/Maintenance');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/maintenance ───────────────────────────────────────────────────
router.get('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.status)  filter.status  = req.query.status;

    const records = await Maintenance.find(filter)
      .populate('vehicle', 'name registrationNumber')
      .populate('performedBy', 'name')
      .sort('-date');
    res.json({ success: true, data: records });
  } catch (err) { next(err); }
});

// ── POST /api/maintenance ──────────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const record = await Maintenance.create({ ...req.body, performedBy: req.user._id });
    await record.populate('vehicle', 'name registrationNumber');
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
});

// ── PUT /api/maintenance/:id ───────────────────────────────────────────────
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
});

// ── DELETE /api/maintenance/:id ────────────────────────────────────────────
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const record = await Maintenance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
