const express = require('express');
const Offer   = require('../models/Offer');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/offers — public ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const offers = await Offer.find({ active: true, validTill: { $gte: new Date() } }).sort('-createdAt');
    res.json({ success: true, data: offers });
  } catch (err) { next(err); }
});

// ── POST /api/offers — admin ───────────────────────────────────────────────
router.post('/', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const offer = await Offer.create(req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (err) { next(err); }
});

// ── PUT /api/offers/:id — admin ────────────────────────────────────────────
router.put('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (err) { next(err); }
});

// ── DELETE /api/offers/:id — admin ────────────────────────────────────────
router.delete('/:id', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Offer deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
