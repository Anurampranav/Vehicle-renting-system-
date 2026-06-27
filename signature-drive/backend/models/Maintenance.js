const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicle:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  type:        { type: String, enum: ['Routine Service','Tyre Change','Oil Change','Brake Service','Engine Repair','Accident Repair','Other'], required: true },
  description: { type: String, trim: true },
  cost:        { type: Number, default: 0 },
  vendor:      { type: String, trim: true },
  date:        { type: Date, required: true, default: Date.now },
  nextDueDate: { type: Date },
  status:      { type: String, enum: ['Scheduled','In Progress','Completed'], default: 'Scheduled' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // admin who logged it
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
