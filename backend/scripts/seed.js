import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Mock doctors & hospitals seeding is permanently disabled.
// The database strictly reflects realtime doctor and hospital entries created by users and hospitals.
const doctors = [];
const hospitals = [];

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('[DB SAFETY GUARD] No MongoDB URI specified in environment.');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const isLiveAtlas = uri.includes('mongodb.net') || uri.includes('cluster');
    if (isLiveAtlas) {
      console.log('[DB SAFETY SHIELD] Connected to MongoDB Atlas cloud database.');
    }

    // STRICT SAFETY SHIELD:
    // Destructive deleteMany({}) or dropping collections is PERMANENTLY DISABLED.
    // Real doctor profiles, appointments, ratings, custom slots, and hospitals
    // will NEVER be wiped or overwritten.

    let addedDocs = 0;
    for (const doc of doctors) {
      const exists = await Doctor.findOne({ email: doc.email.toLowerCase() });
      if (!exists) {
        await Doctor.create(doc);
        addedDocs++;
        console.log(`[Seed] Added missing starter doctor: ${doc.name}`);
      } else {
        console.log(`[Seed] Preserved existing doctor: ${doc.name} (${doc.email})`);
      }
    }

    let addedHosps = 0;
    for (const hosp of hospitals) {
      const exists = await Hospital.findOne({ email: hosp.email.toLowerCase() });
      if (!exists) {
        await Hospital.create(hosp);
        addedHosps++;
        console.log(`[Seed] Added missing starter hospital: ${hosp.name}`);
      } else {
        console.log(`[Seed] Preserved existing hospital: ${hosp.name} (${hosp.email})`);
      }
    }

    const totalDocs = await Doctor.countDocuments();
    const totalHosps = await Hospital.countDocuments();
    console.log(`Database safe-seed finished! Inserted: ${addedDocs} doctors, ${addedHosps} hospitals.`);
    console.log(`Total currently in DB -> Doctors: ${totalDocs}, Hospitals: ${totalHosps}`);

    process.exit(0);
  } catch (error) {
    console.error('Error during safe seed:', error);
    process.exit(1);
  }
};

seedDB();

