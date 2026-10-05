import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from './models/Doctor.js';
import bcrypt from 'bcrypt';

dotenv.config();

const checkDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const doc = await Doctor.findOne({ email: 'dr.rahul@sehatbuddy.com' });
    console.log('Doctor found:', doc);
    const isMatch = await bcrypt.compare('password123', doc.password);
    console.log('Password Match:', isMatch);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkDoctor();
