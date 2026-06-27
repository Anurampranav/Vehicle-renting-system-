const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  by:   { type: String, default: 'Support Team' },
  at:   { type: Date,   default: Date.now },
});

const ticketSchema = new mongoose.Schema({
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName:  { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true },
  category:      { type: String, enum: ['Booking issue','Vehicle problem','Payment & refund','Account & profile','Other enquiry'], required: true },
  bookingRef:    { type: String, trim: true },
  subject:       { type: String, required: true, trim: true },
  message:       { type: String, required: true, trim: true },
  priority:      { type: String, enum: ['Low','Medium','High'], default: 'Low' },
  status:        { type: String, enum: ['Open','In Progress','Resolved','Closed'], default: 'Open' },
  replies:       [replySchema],
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
