import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import Doctor from './models/Doctor.js';

dotenv.config();

const fixDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const doctors = await Doctor.find({});
    
    for (const doc of doctors) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      // Update directly to bypass any pre-save issues
      await Doctor.updateOne({ _id: doc._id }, { $set: { password: hashedPassword } });
      console.log(`Fixed password for ${doc.name}`);
    }
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

fixDoctors();
