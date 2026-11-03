import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock item additions are permanently disabled.
// The database strictly reflects realtime doctor and hospital entries created by users and hospitals.
const newDoctors = [];
const newHospitals = [];

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB. Mock seeding disabled.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
