import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './.env' });

const uri = process.env.MONGO_URI;

const updates = [
  {
    match: { name: /Shashank/i },
    data: {
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
    }
  },
  {
    match: { name: /Rahul Verma/i },
    data: {
      licenseNumber: 'DMC-2009-44182',
      awards: [
        'Best Cardiologist of the Year - National Healthcare Summit (2023)',
        'Excellence in Interventional Cardiology - Cardiological Society of India (2020)',
        'Distinguished Clinical Researcher Award (2018)'
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
        'Chief Resident in Cardiology - All India Institute of Medical Sciences (2011 - 2014)'
      ]
    }
  },
  {
    match: { name: /Neha Sharma/i },
    data: {
      licenseNumber: 'DMC-2014-78219',
      awards: [
        'Rising Star in Women Health - FOGSI (2022)',
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
        'Senior Consultant Gynecologist - Max Super Speciality Hospital (2019 - Present)',
        'Consultant Obstetrician - Fortis La Femme (2016 - 2019)',
        'Senior Resident - Maulana Azad Medical College (2014 - 2016)'
      ]
    }
  },
  {
    match: { name: /Amit Singh/i },
    data: {
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
        'International Society of Arthroscopy & Sports Medicine (ISAKOS)'
      ],
      careerExperience: [
        'Head of Joint Reconstruction & Orthopedics - Fortis Memorial (2018 - Present)',
        'Senior Consultant Orthopedics - Medanta The Medicity (2015 - 2018)',
        'Fellow in Adult Reconstruction - Asklepios Clinic Germany (2013 - 2015)'
      ]
    }
  },
  {
    match: { name: /Pooja Malhotra/i },
    data: {
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
    }
  },
  {
    match: { name: /Priya Nair/i },
    data: {
      licenseNumber: 'TCMC-2015-62194',
      awards: [
        'Best Clinical Neurologist - National Neuro Conclave (2023)',
        'Young Investigator in Stroke Rehabilitation (2021)'
      ],
      certifications: [
        'Board Certified in Neurology (DM Neurology)',
        'Fellowship in Stroke & Neurocritical Care',
        'Comprehensive Neurophysiology Certified'
      ],
      memberships: [
        'Neurological Society of India (NSI)',
        'Indian Academy of Neurology (IAN)',
        'World Stroke Organization (WSO)'
      ],
      careerExperience: [
        'Senior Consultant Neurologist - Aster Medcity (2019 - Present)',
        'Consultant Stroke Specialist - Amrita Institute of Medical Sciences (2016 - 2019)',
        'Senior Registrar - NIMHANS Bangalore (2014 - 2016)'
      ]
    }
  },
  {
    match: { name: /Rajesh Kulkarni/i },
    data: {
      licenseNumber: 'MMC-2010-48201',
      awards: [
        'Pioneer in Robotic Urology Surgery - Indian Urological Congress (2022)',
        'Distinguished Surgeon in Renal Transplantation (2019)'
      ],
      certifications: [
        'Fellow of the Royal College of Surgeons (FRCS Urology, UK)',
        'Certified Robotic Da Vinci Console Surgeon',
        'Advanced Uro-Oncology & Endourology Fellowship'
      ],
      memberships: [
        'Urological Society of India (USI)',
        'American Urological Association (AUA)',
        'European Association of Urology (EAU)'
      ],
      careerExperience: [
        'Director & Chief of Urology - Kokilaben Dhirubhai Ambani Hospital (2018 - Present)',
        'Senior Consultant Urologist - Lilavati Hospital (2014 - 2018)',
        'Consultant Robotic Urologist - Apollo Hospitals (2011 - 2014)'
      ]
    }
  }
];

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  for (const u of updates) {
    const res = await db.collection('doctors').updateMany(u.match, { $set: u.data });
    console.log('Updated for', u.match, 'matched:', res.matchedCount, 'modified:', res.modifiedCount);
  }

  // Also update any doctor that still has missing fields
  const allDocs = await db.collection('doctors').find({}).toArray();
  for (const d of allDocs) {
    if (!d.awards || d.awards.length === 0) {
      const defaultAward = [`Excellence in ${d.specialization || 'Clinical Care'} Award (${new Date().getFullYear() - 1})`];
      const defaultCert = [`Board Certified Specialist in ${d.specialization || 'Medicine'}`];
      const defaultMem = ['Indian Medical Association (IMA)', 'State Medical Council (SMC)'];
      const defaultExp = [
        `Senior Consultant - ${d.hospital || 'Multi-Speciality Hospital'} (${new Date().getFullYear() - 3} - Present)`,
        `Consultant Specialist - Healthcare Network (${new Date().getFullYear() - 7} - ${new Date().getFullYear() - 3})`
      ];
      await db.collection('doctors').updateOne(
        { _id: d._id },
        { 
          $set: { 
            licenseNumber: d.licenseNumber || 'REG-MED-' + String(d._id).slice(-6).toUpperCase(),
            awards: defaultAward,
            certifications: defaultCert,
            memberships: defaultMem,
            careerExperience: defaultExp
          } 
        }
      );
    }
  }

  console.log('All doctors successfully synced with credentials & timeline in MongoDB!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
