const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    console.log('⚠️  Falling back to local MongoDB...');
    try {
      const localConn = await mongoose.connect('mongodb://localhost:27017/signature_drive', {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✅  Local MongoDB connected: ${localConn.connection.host}`);
    } catch (localErr) {
      console.error(`❌  Local MongoDB also failed: ${localErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
