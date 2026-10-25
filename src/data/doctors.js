import doc1 from '../assets/images/doctor-1.png';
import doc2 from '../assets/images/doctor-2.png';

export const initialDoctors = [
  {
    id: 1,
    name: 'Dr. Rahul Verma',
    specialty: 'Cardiologist',
    experience: '15+ Years Experience',
    rating: 0,
    reviews: '0',
    price: 800,
    image: doc1,
    hospital: 'Apollo Hospital & Heart Center',
    degree: 'MBBS, MD (Medicine), DM (Cardiology)',
    phone: '+91 98101 23456',
    email: 'dr.rahul@sehatbuddy.com',
    availableDays: 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
    about: 'Dr. Rahul Verma is a Senior Consultant Interventional Cardiologist with over 15 years of clinical excellence in non-invasive cardiology, coronary interventions, and preventative cardiovascular care. Having performed more than 4,500 successful cardiac catheterizations and angioplasties, he is widely recognized for his diagnostic accuracy and compassionate bedside manner. He completed his DM in Cardiology from AIIMS New Delhi and has held leadership roles at premier academic and tertiary healthcare centers across India. Dr. Verma actively leads clinical trials evaluating novel stent designs and personalized lipid-lowering therapies to mitigate premature arterial disease. He is deeply committed to empowering patients and their families through transparent medical counsel, lifestyle medicine, and continuous post-procedure wellness monitoring.',
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
    id: 2,
    name: 'Dr. Neha Sharma',
    specialty: 'Gynecologist',
    experience: '10+ Years Experience',
    rating: 0,
    reviews: '0',
    price: 700,
    image: doc2,
    hospital: 'Max Super Speciality Hospital',
    degree: 'MBBS, MS (Obstetrics & Gynecology)',
    phone: '+91 98202 34567',
    email: 'dr.neha@sehatbuddy.com',
    availableDays: 'Tue, Thu, Sat (11:00 AM - 5:00 PM)',
    about: 'Dr. Neha Sharma is an accomplished Consultant Obstetrician & Gynecologist with over a decade of dedicated clinical experience in women health. She specializes in high-risk obstetrics, advanced laparoscopic pelvic surgery, reproductive endocrinology, and adolescent gynecological care. Having trained at prestigious national institutions, Dr. Sharma combines minimally invasive surgical precision with a warm, empathetic approach to maternal well-being. She is a pioneer in evidence-based natural birthing techniques and comprehensive hormonal balance programs across all life stages. Dr. Sharma routinely conducts community health workshops and mentors junior surgical fellows in advanced hysteroscopic procedures.',
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
    rating: 0,
    reviews: '0',
    price: 750,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    hospital: 'Fortis Memorial Research Institute',
    degree: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
    phone: '+91 98303 45678',
    email: 'dr.amit@sehatbuddy.com',
    availableDays: 'Mon to Fri (09:00 AM - 2:00 PM)',
    about: 'Dr. Amit Singh is a leading Orthopedic Surgeon and Joint Replacement Specialist with over 12 years of specialized practice in reconstructive surgery and sports trauma. He completed an advanced fellowship in robotic joint arthroplasty in Germany and has successfully treated thousands of patients with complex knee and hip disorders. His clinical focus includes computer-navigated total knee replacement, shoulder arthroscopy, and regenerative cartilage therapies that accelerate athletic recovery. Dr. Singh prioritizes personalized rehabilitation protocols designed to restore pain-free mobility and long-term joint function without unnecessary invasiveness. He serves on international orthopedic advisory boards and frequently lectures on cutting-edge biomechanics and implant longevity.',
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
    rating: 0, 
    reviews: '0', 
    price: 600, 
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', 
    hospital: 'Manipal Hospital & Trauma Center', 
    degree: 'MBBS, MD (Pediatrics), DNB', 
    phone: '+91 98404 56789', 
    email: 'dr.pooja@sehatbuddy.com', 
    availableDays: 'Mon, Tue, Thu, Sat (10:00 AM - 3:00 PM)', 
    about: 'Dr. Pooja Malhotra is a Senior Consultant Pediatrician and Neonatologist with over 8 years of clinical expertise across leading pediatric intensive care units. She completed her MD in Pediatrics and holds specialized certifications in neonatal resuscitation and pediatric pulmonary medicine. Dr. Malhotra is deeply dedicated to comprehensive child wellness, developmental milestones monitoring, preventative immunizations, and pediatric nutritional therapy. Known for her gentle demeanor, she creates a reassuring clinical environment that puts young patients and anxious parents completely at ease. She actively publishes clinical research on early childhood infection control and advocates for accessible pediatric preventive care.',
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
    rating: 0,
    reviews: '0',
    price: 700,
    image: doc1,
    hospital: 'Manipal Hospital, Old Airport Road',
    degree: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    phone: '+91 7839502745',
    email: 'sarthakmisra311@gmail.com',
    availableDays: 'Mon to Sat (10:00 AM - 6:00 PM)',
    about: 'Dr. Shashank is a Consultant Dermatologist, Dermatosurgeon, and Aesthetic Specialist with over 8 years of clinical experience in comprehensive skin and hair disorders. He specializes in advanced laser therapeutics, surgical excision of cutaneous lesions, clinical trichology, and evidence-based acne scar revision. Holding an MD in Dermatology from a renowned medical university, he employs state-of-the-art diagnostic dermoscopy to detect early dermatological conditions. Dr. Shashank believes in tailored dermatological treatment regimens that combine clinical medical therapy with proactive skin barrier protection. He frequently contributes to dermatological research publications and is an active member of national cutaneous surgery associations.',
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
    rating: 0,
    reviews: '0',
    price: 900,
    image: 'https://images.unsplash.com/photo-1594824813589-424a68291f09?auto=format&fit=crop&q=80&w=400',
    hospital: 'Narayana Health City',
    degree: 'MBBS, MD (Medicine), DM (Neurology)',
    phone: '+91 98450 12345',
    email: 'dr.priya.nair@sehatbuddy.com',
    availableDays: 'Mon to Sat (10:00 AM - 4:00 PM)',
    about: 'Dr. Priya Nair is a Senior Neurologist with over 14 years of clinical experience specializing in neuro-critical care, stroke management, epilepsy, and clinical neurophysiology. She completed her DM in Neurology from an acclaimed national institute and directs tertiary neuro-rehabilitation programs for complex movement disorders. Dr. Nair emphasizes rapid intervention protocols for acute ischemic strokes and customized anticonvulsant regimens that enhance patient quality of life. Her clinical philosophy centers on holistic neuromuscular health combined with empathetic patient communication. She is an active investigator in multinational clinical trials evaluating novel neuroprotective therapies.'
  },
  {
    id: 7,
    name: 'Dr. Rajesh Kulkarni',
    specialty: 'Gastroenterologist',
    experience: '16+ Years Experience',
    rating: 0,
    reviews: '0',
    price: 850,
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    hospital: 'Fortis Hospital, Bannerghatta Road',
    degree: 'MBBS, MD, DNB (Gastroenterology)',
    phone: '+91 98451 98765',
    email: 'dr.rajesh.kulkarni@sehatbuddy.com',
    availableDays: 'Tue, Thu, Sat (09:00 AM - 3:00 PM)',
    about: 'Dr. Rajesh Kulkarni is a renowned Gastroenterologist and Hepatologist with over 16 years of clinical practice specializing in advanced therapeutic endoscopy, liver health, and digestive wellness. He has performed thousands of endoscopic retrograde cholangiopancreatography (ERCP) procedures and advanced luminal interventions with exceptional clinical outcomes. Dr. Kulkarni focuses on early detection of gastrointestinal malignancies and personalized medical management of chronic inflammatory bowel disorders. Dedicated to patient education, he conducts routine screenings and wellness seminars to promote digestive and metabolic longevity. He serves as an executive council member for regional gastroenterology societies and leads academic teaching rounds.'
  }
];

// Exporting doctors alias for backward compatibility
export const doctors = initialDoctors;
