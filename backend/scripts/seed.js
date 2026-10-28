import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const doctors = [
  {
    name: 'Dr. Rahul Verma',
    specialization: 'Cardiologist',
    experience: 15,
    fees: 800,
    image: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190466/sehatbuddy/doctors/doctor-1.jpg',
    hospital: 'Apollo Hospital & Heart Center',
    qualifications: 'MBBS, MD (Medicine), DM (Cardiology)',
    contact_number: '+91 98101 23456',
    email: 'dr.rahul@sehatbuddy.com',
    password: 'password123',
    about: 'Senior consultant cardiologist specializing in non-invasive cardiology and coronary interventions.',
    instagram: 'https://www.instagram.com/thesehatbuddy/',
    facebook: 'https://www.facebook.com/profile.php?id=61594704587784',
    reels: [
      'https://www.instagram.com/reel/DWGyY03lWc2/',
      'https://www.instagram.com/reel/DXpDWdoDKai/',
      'https://www.instagram.com/reel/DZdBbmoM1tn/',
      'https://www.instagram.com/reel/C-U4Xo9MvjQ/',
      'https://www.instagram.com/reel/DdeXVmDohij/'
    ],
    youtube_videos: [
      'https://www.youtube.com/watch?v=zCCD52Pty4A',
      'https://www.youtube.com/watch?v=FN3MFhYPWWo'
    ]
  },
  {
    name: 'Dr. Neha Sharma',
    specialization: 'Gynecologist',
    experience: 10,
    fees: 700,
    image: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1793190467/sehatbuddy/doctors/doctor-2.jpg',
    hospital: 'Max Super Speciality Hospital',
    qualifications: 'MBBS, MS (Obstetrics & Gynecology)',
    contact_number: '+91 98202 34567',
    email: 'dr.neha@sehatbuddy.com',
    password: 'password123',
    about: 'Expert in high-risk obstetrics, laparoscopic gynecological surgeries, and women hormonal wellness.'
  },
  {
    name: 'Dr. Amit Singh',
    specialization: 'Orthopedic',
    experience: 12,
    fees: 750,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    hospital: 'Fortis Memorial Research Institute',
    qualifications: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
    contact_number: '+91 98303 45678',
    email: 'dr.amit@sehatbuddy.com',
    password: 'password123',
    about: 'Specialized in joint reconstruction, arthroscopy, and minimally invasive sports trauma repairs.'
  },
  {
    name: 'Dr. Pooja Malhotra',
    specialization: 'Pediatrician',
    experience: 8,
    fees: 600,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    hospital: 'Manipal Hospital & Trauma Center',
    qualifications: 'MBBS, MD (Pediatrics), DNB',
    contact_number: '+91 98404 56789',
    email: 'dr.pooja@sehatbuddy.com',
    password: 'password123',
    about: 'Dedicated child health specialist with extensive experience in pediatric intensive care and vaccinations.'
  }
];

const hospitals = [
  {
    name: 'Apollo Hospital & Heart Center',
    email: 'apollo@sehatbuddy.com',
    password: 'password123',
    address: '123 Health Ave, Central District',
    city: 'New Delhi',
    phone: '1800-123-4567',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=400',
    description: 'Leading multispecialty hospital with advanced cardiac care.',
    specialities: ['Cardiology', 'Neurology', 'Orthopedics'],
    isVerified: true
  },
  {
    name: 'Max Super Speciality Hospital',
    email: 'max@sehatbuddy.com',
    password: 'password123',
    address: '45 Wellness Blvd, North Zone',
    city: 'New Delhi',
    phone: '1800-987-6543',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400',
    description: 'State-of-the-art facility specializing in maternal and child care.',
    specialities: ['Gynecology', 'Pediatrics', 'Oncology'],
    isVerified: true
  }
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Clear existing
    await Doctor.deleteMany({});
    await Hospital.deleteMany({});
    console.log('Cleared existing doctors and hospitals');

    // Insert new
    await Doctor.insertMany(doctors);
    await Hospital.insertMany(hospitals);
    console.log('Successfully seeded database with doctors and hospitals!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();

