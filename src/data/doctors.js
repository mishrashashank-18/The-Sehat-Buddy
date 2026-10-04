import doc1 from '../assets/images/doctor-1.png';
import doc2 from '../assets/images/doctor-2.png';
import doc3 from '../assets/images/doctor-3.png';
import doc4 from '../assets/images/doctor-4.png';

export const initialDoctors = [
  {
    id: 1,
    name: 'Dr. Rahul Verma',
    specialty: 'Cardiologist',
    experience: '15+ Years Experience',
    rating: 4.8,
    reviews: '1200+',
    price: 800,
    image: doc1,
    hospital: 'Apollo Hospital & Heart Center',
    degree: 'MBBS, MD (Medicine), DM (Cardiology)',
    phone: '+91 98101 23456',
    email: 'dr.rahul@sehatbuddy.com',
    availableDays: 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
    about: 'Senior consultant cardiologist specializing in non-invasive cardiology and coronary interventions.',
    instagram: 'https://www.instagram.com/thesehatbuddy/',
    facebook: 'https://www.facebook.com/profile.php?id=61594704587784',
    reels: [
      'https://www.instagram.com/reel/C-U4Xo9MvjQ/',
      'https://www.instagram.com/reel/C9_K5qXMO9e/'
    ],
    youtube_videos: [
      'https://www.youtube.com/watch?v=zCCD52Pty4A',
      'https://www.youtube.com/watch?v=FN3MFhYPWWo'
    ]
  },
  {
    id: 2,
    name: 'Dr. Neha Sharma',
    specialty: 'Gynecologist',
    experience: '10+ Years Experience',
    rating: 4.7,
    reviews: '950+',
    price: 700,
    image: doc2,
    hospital: 'Max Super Speciality Hospital',
    degree: 'MBBS, MS (Obstetrics & Gynecology)',
    phone: '+91 98202 34567',
    email: 'dr.neha@sehatbuddy.com',
    availableDays: 'Tue, Thu, Sat (11:00 AM - 5:00 PM)',
    about: 'Expert in high-risk obstetrics, laparoscopic gynecological surgeries, and women hormonal wellness.'
  },
  {
    id: 3,
    name: 'Dr. Amit Singh',
    specialty: 'Orthopedic',
    experience: '12+ Years Experience',
    rating: 4.6,
    reviews: '870+',
    price: 750,
    image: doc3,
    hospital: 'Fortis Memorial Research Institute',
    degree: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
    phone: '+91 98303 45678',
    email: 'dr.amit@sehatbuddy.com',
    availableDays: 'Mon to Fri (09:00 AM - 2:00 PM)',
    about: 'Specialized in joint reconstruction, arthroscopy, and minimally invasive sports trauma repairs.'
  } 
  ,{ 
    id: 4, 
    name: 'Dr. Pooja Malhotra', 
    specialty: 'Pediatrician', 
    experience: '8+ Years Experience', 
    rating: 4.9, 
    reviews: '1100+', 
    price: 600, 
    image: doc4, 
    hospital: 'Manipal Hospital & Trauma Center', 
    degree: 'MBBS, MD (Pediatrics), DNB', 
    phone: '+91 98404 56789', 
    email: 'dr.pooja@sehatbuddy.com', 
    availableDays: 'Mon, Tue, Thu, Sat (10:00 AM - 3:00 PM)', 
    about: 'Dedicated child health specialist with extensive experience in pediatric intensive care and vaccinations.' 
  }
];

// Exporting doctors alias for backward compatibility
export const doctors = initialDoctors;
