const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  vehicle:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  pickupDate:    { type: Date, required: true },
  returnDate:    { type: Date, required: true },
  days:          { type: Number, required: true, min: 1 },
  location:      { type: String, required: true },
  pricePerDay:   { type: Number, required: true },
  subtotal:      { type: Number, required: true },
  tax:           { type: Number, required: true },
  total:         { type: Number, required: true },
  paymentMethod: { type: String, enum: ['UPI','Card','Cash'], default: 'Card' },
  status:        { type: String, enum: ['Confirmed','Active','Completed','Cancelled','Paid'], default: 'Confirmed' },
  cancelReason:  { type: String },
  notes:         { type: String },
}, { timestamps: true });

// Prevent double-booking the same vehicle on overlapping dates
bookingSchema.index({ vehicle: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
