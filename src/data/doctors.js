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
    licenseNumber: 'DMC-2009-44182',
    awards: [
      'Best Cardiologist of the Year - National Healthcare Summit (2023)',
      'Excellence in Interventional Cardiology - Cardiological Society of India (2020)',
      'Distinguished Clinical Researcher Award - Indian Council of Medical Research (2018)',
      'Excellence in Patient Care & Clinical Service - Apollo Healthcare (2022)'
    ],
    certifications: [
      'Fellow of the American College of Cardiology (FACC)',
      'Fellow of Society for Cardiovascular Angiography & Interventions (FSCAI)',
      'Advanced Cardiac Life Support (ACLS) Certified Provider',
      'Post-Doctoral Fellowship in Complex Coronary Angioplasty'
    ],
    memberships: [
      'Cardiological Society of India (CSI) - Life Member',
      'Indian Medical Association (IMA)',
      'European Society of Cardiology (ESC)',
      'Association of Physicians of India (API)'
    ],
    careerExperience: [
      'Senior Consultant Interventional Cardiologist - Apollo Hospital (2018 - Present)',
      'Associate Consultant Cardiology - Fortis Healthcare (2014 - 2018)',
      'Chief Resident in Cardiology - All India Institute of Medical Sciences (2011 - 2014)',
      'Clinical Fellow in Interventional Cardiology - AIIMS New Delhi (2009 - 2011)'
    ],
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
    about: 'Expert in high-risk obstetrics, laparoscopic gynecological surgeries, and women hormonal wellness.',
    licenseNumber: 'DMC-2014-78219',
    awards: [
      'Rising Star in Women Health - Federation of Obstetric & Gynaecological Societies of India (2022)',
      'Excellence in Minimally Invasive Gynecological Surgery (2019)'
    ],
    certifications: [
      'Board Certified in Obstetrics & Gynecology',
      'Fellowship in Advanced Laparoscopic Surgery (FALS)',
      'Certified Infertility & IVF Specialist'
    ],
    memberships: [
      'Federation of Obstetric & Gynaecological Societies of India (FOGSI)',
      'Indian Medical Association (IMA)',
      'Association of Obstetricians & Gynaecologists of Delhi (AOGD)'
    ],
    careerExperience: [
      'Senior Consultant Gynecologist & Laparoscopic Surgeon - Max Super Speciality Hospital (2019 - Present)',
      'Consultant Obstetrician - Fortis La Femme (2016 - 2019)',
      'Senior Resident - Maulana Azad Medical College (2014 - 2016)'
    ]
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
    about: 'Specialized in joint reconstruction, arthroscopy, and minimally invasive sports trauma repairs.',
    licenseNumber: 'MMC-2012-39041',
    awards: [
      'Best Orthopedic Surgeon in Joint Replacement - National Health Awards (2021)',
      'Pioneer in Robotic Knee Surgery Honor (2023)'
    ],
    certifications: [
      'Fellowship in Joint Replacement Surgery (Germany)',
      'AO Trauma Certified Surgeon',
      'Robotic Knee & Hip Arthroplasty Certified Specialist'
    ],
    memberships: [
      'Indian Orthopaedic Association (IOA)',
      'Delhi Orthopaedic Association (DOA)',
      'International Society of Arthroscopy, Knee Surgery and Orthopaedic Sports Medicine (ISAKOS)'
    ],
    careerExperience: [
      'Head of Joint Reconstruction & Orthopedic Surgery - Fortis Memorial (2018 - Present)',
      'Senior Consultant Orthopedics - Medanta The Medicity (2015 - 2018)',
      'Fellow in Adult Reconstruction - Asklepios Clinic Germany (2013 - 2015)'
    ]
  },
  { 
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
    about: 'Dedicated child health specialist with extensive experience in pediatric intensive care and vaccinations.',
    licenseNumber: 'KMC-2016-55120',
    awards: [
      'Excellence in Neonatal & Pediatric Care - State Pediatric Summit (2022)',
      'Community Child Health Champion Award (2020)'
    ],
    certifications: [
      'Pediatric Advanced Life Support (PALS) Certified Instructor',
      'Fellowship in Neonatal Intensive Care (FICN)',
      'Certified Pediatric Pulmonology & Allergy Specialist'
    ],
    memberships: [
      'Indian Academy of Pediatrics (IAP)',
      'National Neonatology Forum (NNF)',
      'Indian Medical Association (IMA)'
    ],
    careerExperience: [
      'Senior Consultant Pediatrician & Neonatologist - Manipal Hospital (2020 - Present)',
      'Consultant Pediatric Care - Rainbow Children Hospital (2018 - 2020)',
      'Senior Resident Pediatric ICU - AIIMS (2016 - 2018)'
    ]
  },
  {
    id: 5,
    name: 'Shashank',
    specialty: 'Dermatologist',
    experience: '8+ Years Experience',
    rating: 4.8,
    reviews: '250+',
    price: 700,
    image: doc1,
    hospital: 'Manipal Hospital, Old Airport Road',
    degree: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    phone: '+91 7839502745',
    email: 'sarthakmisra311@gmail.com',
    availableDays: 'Mon to Sat (10:00 AM - 6:00 PM)',
    about: 'Experienced Consultant Dermatologist & Aesthetic Specialist specializing in clinical dermatology, laser treatments, trichology, and advanced skin care therapy.',
    licenseNumber: 'KMC-2016-92841',
    awards: [
      'Excellence in Clinical Dermatology & Aesthetic Medicine (2023)',
      'Young Dermatologist of the Year - Karnataka Medical Forum (2021)',
      'Best Paper in Cutaneous Laser Therapeutics (2019)'
    ],
    certifications: [
      'Board Certified in Clinical Dermatology & Venereology',
      'Fellowship in Aesthetic Medicine & Laser Technologies (FAM)',
      'Advanced Dermatosurgery & Trichology Certification'
    ],
    memberships: [
      'Indian Association of Dermatologists, Venereologists and Leprologists (IADVL)',
      'Association of Cutaneous Surgeons of India (ACSI)',
      'Indian Medical Association (IMA)'
    ],
    careerExperience: [
      'Senior Consultant Dermatologist - Manipal Hospital, Old Airport Road (2020 - Present)',
      'Consultant Dermatologist & Trichologist - Kaya Skin Clinic (2018 - 2020)',
      'Senior Resident in Dermatology - Victoria Hospital Medical College (2016 - 2018)'
    ]
  },
  {
    id: 6,
    name: 'Dr. Priya Nair',
    specialty: 'Neurologist',
    experience: '14+ Years Experience',
    rating: 4.9,
    reviews: '140+',
    price: 900,
    image: 'https://images.unsplash.com/photo-1594824813589-424a68291f09?auto=format&fit=crop&q=80&w=400',
    hospital: 'Narayana Health City',
    degree: 'MBBS, MD (Medicine), DM (Neurology)',
    phone: '+91 98450 12345',
    email: 'dr.priya.nair@sehatbuddy.com',
    availableDays: 'Mon to Sat (10:00 AM - 4:00 PM)',
    about: 'Senior Neurologist specializing in neuro-critical care, stroke management, epilepsy, and clinical neurophysiology.'
  },
  {
    id: 7,
    name: 'Dr. Rajesh Kulkarni',
    specialty: 'Gastroenterologist',
    experience: '16+ Years Experience',
    rating: 4.8,
    reviews: '110+',
    price: 850,
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    hospital: 'Fortis Hospital, Bannerghatta Road',
    degree: 'MBBS, MD, DNB (Gastroenterology)',
    phone: '+91 98451 98765',
    email: 'dr.rajesh.kulkarni@sehatbuddy.com',
    availableDays: 'Tue, Thu, Sat (09:00 AM - 3:00 PM)',
    about: 'Renowned gastroenterologist and hepatologist specializing in advanced therapeutic endoscopy, liver health, and digestive wellness.'
  }
];

// Exporting doctors alias for backward compatibility
export const doctors = initialDoctors;
