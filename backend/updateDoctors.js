import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Doctor from './models/Doctor.js';

dotenv.config();

const updateDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors`);

    if (doctors.length === 0) {
      console.log('No doctors found in database.');
      process.exit();
    }
    
    for (const doc of doctors) {
      // Set a generic email based on their name if they don't have one
      const nameParts = doc.name.toLowerCase().replace('dr.', '').trim().split(' ');
      const newEmail = `dr.${nameParts[0]}@sehatbuddy.com`;
      const plainPassword = 'password123';
      
      doc.email = newEmail;
      doc.password = plainPassword; // Mongoose 'pre-save' hook will hash this
      
      await doc.save();
      console.log(`Updated ${doc.name}: Email -> ${newEmail}, Password -> ${plainPassword}`);
    }
    
    console.log('All doctors updated successfully.');
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateDoctors();
