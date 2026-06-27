const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  name:               { type: String, required: true, trim: true },
  category:           { type: String, enum: ['Scooter','Hatchback','Sedan','SUV'], required: true },
  pricePerDay:        { type: Number, required: true, min: 0 },
  seats:              { type: Number, required: true, min: 1 },
  fuel:               { type: String, enum: ['Petrol','Diesel','Electric','CNG'], required: true },
  transmission:       { type: String, enum: ['Manual','Auto'], required: true },
  location:           { type: String, required: true, trim: true },
  registrationNumber: { type: String, trim: true },
  description:        { type: String, trim: true },
  icon:               { type: String, default: 'directions_car' },
  imageUrl:           { type: String },
  available:          { type: Boolean, default: true },
  owner:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Maintenance tracking
  lastServiced:       { type: Date },
  nextServiceDue:     { type: Date },
  totalKm:            { type: Number, default: 0 },
}, { timestamps: true });

// Virtual: average rating
vehicleSchema.virtual('avgRating', {
  ref:          'Review',
  localField:   '_id',
  foreignField: 'vehicle',
});

vehicleSchema.set('toJSON', { virtuals: true });
vehicleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
