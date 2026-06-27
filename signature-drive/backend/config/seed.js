require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const User     = require('../models/User');
const Vehicle  = require('../models/Vehicle');
const Booking  = require('../models/Booking');
const Payment  = require('../models/Payment');
const Offer    = require('../models/Offer');
const Ticket   = require('../models/Ticket');
const Review   = require('../models/Review');

async function seed() {
  await connectDB();

  // Clear all collections
  await Promise.all([
    User.deleteMany({}), Vehicle.deleteMany({}), Booking.deleteMany({}),
    Payment.deleteMany({}), Offer.deleteMany({}), Ticket.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log('🗑  Cleared all collections');

  // ── Users ─────────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedUser  = await bcrypt.hash('priya123', 10);

  const [admin, customer] = await User.insertMany([
    {
      name: 'Admin Owner', email: 'admin@sdr.in', phone: '+91 98765 00000',
      password: hashedAdmin, role: 'admin',
    },
    {
      name: 'Priya Menon', email: 'priya@gmail.com', phone: '+91 98765 11111',
      password: hashedUser, role: 'customer',
    },
  ]);
  console.log('👤  Users seeded');

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const vehicles = await Vehicle.insertMany([
    { name:'Honda Activa 6G',    category:'Scooter',  pricePerDay:299,  seats:2, fuel:'Petrol',  transmission:'Auto',   location:'Bengaluru', registrationNumber:'KA 01 HB 2345', description:'Perfect city scooter, great mileage.', icon:'moped',           available:true, owner:admin._id },
    { name:'Maruti Swift Dzire', category:'Sedan',    pricePerDay:599,  seats:5, fuel:'Diesel',  transmission:'Manual', location:'Bengaluru', registrationNumber:'KA 05 MN 7890', description:'Comfortable sedan for road trips.',    icon:'directions_car',   available:true, owner:admin._id },
    { name:'Mahindra Scorpio-N', category:'SUV',      pricePerDay:1299, seats:7, fuel:'Diesel',  transmission:'Auto',   location:'Bengaluru', registrationNumber:'KA 03 XY 4567', description:'Powerful SUV for off-road adventures.', icon:'airport_shuttle', available:true, owner:admin._id },
    { name:'Maruti Baleno',      category:'Hatchback',pricePerDay:449,  seats:5, fuel:'Petrol',  transmission:'Manual', location:'Mumbai',    registrationNumber:'MH 02 AB 1234', description:'Spacious hatchback for family trips.',  icon:'directions_car',   available:true, owner:admin._id },
    { name:'TVS Jupiter 125',    category:'Scooter',  pricePerDay:249,  seats:2, fuel:'Petrol',  transmission:'Auto',   location:'Chennai',   registrationNumber:'TN 09 CD 5678', description:'Lightweight scooter for daily commutes.', icon:'moped',         available:true, owner:admin._id },
    { name:'Toyota Innova Crysta',category:'SUV',     pricePerDay:1799, seats:7, fuel:'Diesel',  transmission:'Auto',   location:'Delhi',     registrationNumber:'DL 01 EF 9012', description:'Premium MPV for group travel.',         icon:'airport_shuttle', available:true, owner:admin._id },
  ]);
  console.log('🚗  Vehicles seeded');

  // ── Booking + Payment ─────────────────────────────────────────────────────
  const booking = await Booking.create({
    customer:    customer._id,
    vehicle:     vehicles[1]._id,
    pickupDate:  new Date('2024-06-01'),
    returnDate:  new Date('2024-06-05'),
    days:        4,
    location:    'Bengaluru, Karnataka',
    pricePerDay: 599,
    subtotal:    2396,
    tax:         431,
    total:       2827,
    status:      'Completed',
    paymentMethod:'UPI',
  });

  await Payment.create({
    booking:  booking._id,
    customer: customer._id,
    amount:   2827,
    method:   'UPI',
    status:   'Completed',
    transactionId: 'TXN' + Date.now(),
  });
  console.log('📋  Booking + Payment seeded');

  // ── Review ────────────────────────────────────────────────────────────────
  await Review.create({
    booking:  booking._id,
    vehicle:  vehicles[1]._id,
    customer: customer._id,
    rating:   5,
    text:     'Great car, smooth drive. Highly recommend for road trips!',
  });
  console.log('⭐  Review seeded');

  // ── Offers ────────────────────────────────────────────────────────────────
  await Offer.insertMany([
    { title:'Weekend Special',  description:'Get 20% off on all bookings this weekend.',                code:'WEEKEND20', discountPercent:20,         validTill: new Date('2025-12-31') },
    { title:'First Ride Free',  description:'First-time users get ₹500 off above ₹799/day.',           code:'FIRST500',  discountAmount:500,          validTill: new Date('2025-12-31') },
    { title:'Long Trip Saver',  description:'Book for 7+ days and get 15% off automatically.',          code:'LONG15',    discountPercent:15,          validTill: new Date('2025-12-31') },
  ]);
  console.log('🎁  Offers seeded');

  console.log('\n✅  Seed complete!');
  console.log('   Admin   → admin@sdr.in   / admin123');
  console.log('   Customer→ priya@gmail.com / priya123\n');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
