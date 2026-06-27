const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking:       { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  amount:        { type: Number, required: true },
  method:        { type: String, enum: ['UPI','Card','Cash'], required: true },
  status:        { type: String, enum: ['Pending','Completed','Failed','Refunded'], default: 'Pending' },
  transactionId: { type: String, unique: true, sparse: true },
  razorpayOrderId:     { type: String },
  razorpayPaymentId:   { type: String },
  razorpaySignature:    { type: String },
  paymentMethod:        { type: String },
  paymentStatus:        { type: String },
  transactionDate:      { type: Date, default: Date.now },
  refundAmount:  { type: Number, default: 0 },
  refundReason:  { type: String },
  refundedAt:    { type: Date },
  meta:          { type: mongoose.Schema.Types.Mixed }, // gateway response
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
