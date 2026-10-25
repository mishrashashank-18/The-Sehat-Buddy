import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Avatar from '../models/Avatar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const avatars = [
  {
    key: 'male_doctor',
    label: 'Male Doctor Avatar',
    gender: 'male',
    url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893957/sehatbuddy/avatars/default_doctor_male.png',
    localPath: '/avatars/avatar-male.png',
    isDefault: true
  },
  {
    key: 'female_doctor',
    label: 'Female Doctor Avatar',
    gender: 'female',
    url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893958/sehatbuddy/avatars/default_doctor_female.jpg',
    localPath: '/avatars/avatar-female.jpg',
    isDefault: true
  }
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('MongoDB Connected');

    for (const av of avatars) {
      await Avatar.findOneAndUpdate({ key: av.key }, av, { upsert: true, new: true });
      console.log(`Saved avatar: ${av.label}`);
    }

    const all = await Avatar.find();
    console.log('Current Avatars in DB:', all);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
