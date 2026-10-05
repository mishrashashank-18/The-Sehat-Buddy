import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from './models/Hospital.js';
import Doctor from './models/Doctor.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const sampleReels = [
  'https://www.instagram.com/reel/DeArmJdSQa6/?stkn=MWhjZGczNGhyandlbA==',
  'https://www.instagram.com/reel/DeAA8evMsBS/?stkn=cDQ0YXFpOG5kaDc1',
  'https://www.instagram.com/reel/DdrR6vApDBK/?stkn=MXV6Yzg4NzM3cDdlbw==',
  'https://www.instagram.com/reel/DdmEKEvTVC5/?utm_source=ig_web_copy_link&stkn=NTc4MTIwNjQ2YQ==',
  'https://www.instagram.com/reel/DdeXVmDohij/?stkn=b2RzcXFveTY2azZv'
];

const sampleVideos = [
  'https://www.youtube.com/watch?v=zCCD52Pty4A',
  'https://www.youtube.com/watch?v=FN3MFhYPWWo',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  'https://www.youtube.com/watch?v=JGwWNGJdvx8'
];

const updateHospitalsData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const doctors = await Doctor.find({});
    console.log(`Found ${doctors.length} doctors`);

    // Mark all existing doctors as star doctors if not already
    for (const doc of doctors) {
      doc.isStarDoctor = true;
      await doc.save();
    }

    const doctorIds = doctors.map(d => d._id);

    const hospitals = await Hospital.find({});
    console.log(`Found ${hospitals.length} hospitals`);

    const coordsMap = {
      'Manipal Hospital, Old Airport Road': { lat: 12.9592, lng: 77.6534 },
      'Narayana Health City': { lat: 12.8228, lng: 77.6881 },
      'Fortis Hospital, Bannerghatta Road': { lat: 12.8938, lng: 77.5976 },
      'Apollo Hospitals, Seshadripuram': { lat: 12.9926, lng: 77.5709 },
      'Apollo Hospital & Heart Center': { lat: 28.5355, lng: 77.2882 },
      'Max Super Speciality Hospital': { lat: 28.5273, lng: 77.2120 },
      'Fortis Memorial Research Institute': { lat: 28.4595, lng: 77.0725 },
      'Manipal Hospital & Trauma Center': { lat: 12.9592, lng: 77.6534 }
    };

    for (let i = 0; i < hospitals.length; i++) {
      const hosp = hospitals[i];
      hosp.reels = sampleReels;
      hosp.youtube_videos = sampleVideos;
      hosp.rating = hosp.rating || 4.8;
      hosp.reviews = hosp.reviews || '1,250+ Reviews';
      hosp.totalBeds = hosp.totalBeds || (350 + i * 120);
      hosp.emergency24x7 = true;
      hosp.establishedYear = hosp.establishedYear || (1995 + i * 4);
      // Assign star doctors: assign at least 2-3 doctors or all to each hospital
      hosp.star_doctors = doctorIds;
      
      const matchedCoords = coordsMap[hosp.name] || { lat: 12.9716 + (i * 0.02), lng: 77.5946 + (i * 0.02) };
      hosp.latitude = matchedCoords.lat;
      hosp.longitude = matchedCoords.lng;

      await hosp.save();
      console.log(`Updated hospital: ${hosp.name} with coords: ${hosp.latitude}, ${hosp.longitude}`);
    }

    console.log('Successfully updated all hospitals with 5 reels, 5 youtube videos, and star doctors!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating hospitals:', error);
    process.exit(1);
  }
};

updateHospitalsData();
