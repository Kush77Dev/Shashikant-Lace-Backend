import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    let rawUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shashikant_lace';
    // Clean up accidental quotes or whitespace in env variable
    const cleanUri = rawUri.trim().replace(/^["']|["']$/g, '');

    const conn = await mongoose.connect(cleanUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};
