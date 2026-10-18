import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sampleReels = [
  'https://www.instagram.com/reel/DeArmJdSQa6/?stkn=MWhjZGczNGhyandlbA==',
  'https://www.instagram.com/reel/DeAA8evMsBS/?stkn=cDQ0YXFpOG5kaDc1',
  'https://www.instagram.com/reel/DdrR6vApDBK/?stkn=MXV6Yzg4NzM3cDdlbw=='
];

const sampleVideos = [
  'https://www.youtube.com/watch?v=zCCD52Pty4A',
  'https://www.youtube.com/watch?v=FN3MFhYPWWo'
];

const newDoctors = [
  {
    name: 'Dr. Priya Nair',
    email: 'dr.priya.nair@sehatbuddy.com',
    password: 'password123',
    specialization: 'Neurologist',
    experience: 14,
    fees: 900,
    image: 'https://images.unsplash.com/photo-1594824813589-424a68291f09?auto=format&fit=crop&q=80&w=400',
    hospital: 'Narayana Health City',
    qualifications: 'MBBS, MD (Medicine), DM (Neurology)',
    contact_number: '+91 98450 12345',
    about: 'Senior Neurologist specializing in neuro-critical care, stroke management, epilepsy, and clinical neurophysiology.',
    rating: 4.9,
    reviews: '140+',
    isStarDoctor: true,
    available: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  },
  {
    name: 'Dr. Rajesh Kulkarni',
    email: 'dr.rajesh.kulkarni@sehatbuddy.com',
    password: 'password123',
    specialization: 'Gastroenterologist',
    experience: 16,
    fees: 850,
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    hospital: 'Fortis Hospital, Bannerghatta Road',
    qualifications: 'MBBS, MD, DNB (Gastroenterology)',
    contact_number: '+91 98451 98765',
    about: 'Renowned gastroenterologist and hepatologist specializing in advanced therapeutic endoscopy, liver health, and digestive wellness.',
    rating: 4.8,
    reviews: '110+',
    isStarDoctor: true,
    available: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  }
];

const newHospitals = [
  {
    name: 'Aster CMI Hospital, Hebbal',
    email: 'info@astercmi.com',
    password: 'password123',
    address: 'No. 43/2, New Airport Road, NH 44, Sahakar Nagar, Hebbal, Bengaluru, Karnataka 560092',
    city: 'Bengaluru, Karnataka',
    phone: '+91 80 4342 0100',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    description: 'Aster CMI Hospital is a premier quaternary care hospital equipped with cutting-edge medical infrastructure, robotic surgical systems, and centers of excellence in cardiology, neurology, and organ transplants.',
    specialities: ['Cardiology', 'Neurology', 'Organ Transplant', 'Oncology', 'Orthopedics'],
    rating: 4.8,
    reviews: '1,450+',
    totalBeds: 500,
    emergency24x7: true,
    establishedYear: 2014,
    latitude: 13.0617,
    longitude: 77.5925,
    isVerified: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  },
  {
    name: 'Cloudnine Hospital, Jayanagar',
    email: 'support@cloudninecare.com',
    password: 'password123',
    address: '1533, 9th Main Road, 3rd Block, Jayanagar, Bengaluru, Karnataka 560011',
    city: 'Bengaluru, Karnataka',
    phone: '+91 99728 99728',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
    description: "India's leading maternal and child healthcare facility offering comprehensive women's health, maternity suites, level-III NICU care, and pediatric medicine.",
    specialities: ['Gynecology & Obstetrics', 'Pediatrics', 'Neonatology', 'Fertility Care'],
    rating: 4.9,
    reviews: '2,100+',
    totalBeds: 120,
    emergency24x7: true,
    establishedYear: 2007,
    latitude: 12.9288,
    longitude: 77.5833,
    isVerified: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  },
  {
    name: 'Sakra World Hospital, Marathahalli',
    email: 'care@sakraworldhospital.com',
    password: 'password123',
    address: 'Sy. No. 52/2 & 52/3, Devarabeesanahalli Flyover, Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560103',
    city: 'Bengaluru, Karnataka',
    phone: '+91 80 4969 4969',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
    description: 'Indo-Japanese collaborative hospital pioneering Japanese medical technologies, precision neurosurgery, and patient-centric healthcare standards.',
    specialities: ['Neurosciences', 'Cardiac Sciences', 'Orthopedics', 'Emergency & Trauma'],
    rating: 4.8,
    reviews: '1,800+',
    totalBeds: 350,
    emergency24x7: true,
    establishedYear: 2014,
    latitude: 12.9298,
    longitude: 77.6841,
    isVerified: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  },
  {
    name: 'Columbia Asia Hospital, Whitefield',
    email: 'customercare.whitefield@columbiaasia.com',
    password: 'password123',
    address: 'Survey No. 10P & 12P, Ramagondanahalli, Varthur Kodi, Whitefield, Bengaluru, Karnataka 560066',
    city: 'Bengaluru, Karnataka',
    phone: '+91 80 6165 6265',
    image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
    description: 'Leading multi-specialty healthcare provider delivering international standard treatments with state-of-the-art diagnostic labs and 24x7 emergency response.',
    specialities: ['General Surgery', 'Cardiology', 'Pediatrics', 'Critical Care', 'Internal Medicine'],
    rating: 4.7,
    reviews: '1,600+',
    totalBeds: 250,
    emergency24x7: true,
    establishedYear: 2011,
    latitude: 12.9698,
    longitude: 77.7499,
    isVerified: true,
    reels: sampleReels,
    youtube_videos: sampleVideos
  }
];

async function run() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    for (const doc of newDoctors) {
      const exists = await Doctor.findOne({ email: doc.email.toLowerCase() });
      if (!exists) {
        await Doctor.create(doc);
        console.log(`Created doctor: ${doc.name}`);
      } else {
        console.log(`Doctor already exists: ${doc.name}`);
      }
    }

    for (const hosp of newHospitals) {
      const exists = await Hospital.findOne({ email: hosp.email.toLowerCase() });
      if (!exists) {
        await Hospital.create(hosp);
        console.log(`Created hospital: ${hosp.name}`);
      } else {
        console.log(`Hospital already exists: ${hosp.name}`);
      }
    }

    const totalDocs = await Doctor.countDocuments();
    const totalHosps = await Hospital.countDocuments();
    console.log(`Completed! Total doctors in DB: ${totalDocs}, Total hospitals in DB: ${totalHosps}`);
    process.exit(0);
  } catch (err) {
    console.error('Error adding items:', err);
    process.exit(1);
  }
}

run();
