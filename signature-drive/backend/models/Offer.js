const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  description:     { type: String, trim: true },
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, default: 0 },
  discountAmount:  { type: Number, default: 0 },
  validTill:       { type: Date, required: true },
  active:          { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
