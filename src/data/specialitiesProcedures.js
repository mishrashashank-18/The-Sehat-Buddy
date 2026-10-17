export const initialSpecialities = [
  {
    id: 'spec-1',
    name: 'Robotic Surgery',
    type: 'speciality',
    icon: 'Bot',
    description: 'Precision minimally-invasive surgeries with AI-assisted robotic arms, enabling faster recovery and minimal blood loss.',
    isPopular: true,
    order: 1,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: 'Up to 100% Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹1,20,000 - ₹2,80,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Robotic Knee Replacement', 'Robotic Prostatectomy', 'Robotic Hernia Repair', 'Robotic Bariatric Surgery']
  },
  {
    id: 'spec-2',
    name: 'Cancer Care / Oncology',
    type: 'speciality',
    icon: 'Ribbon',
    description: 'Comprehensive cancer treatment programs including surgical oncology, targeted chemotherapy, immunotherapy, and radiation.',
    isPopular: true,
    order: 2,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Available',
      cashlessAvailable: true,
      preAuthHours: '45 Mins Pre-Approval',
      estimatedCostRange: '₹80,000 - ₹3,50,000',
      outOfPocketWithInsurance: '₹0 with Critical Illness Coverage',
      emiAvailable: true
    },
    procedures: ['Tumor Resection', 'Chemotherapy Port Insertion', 'Surgical Oncology', 'Radiation Planning']
  },
  {
    id: 'spec-3',
    name: 'Cardiac Sciences',
    type: 'speciality',
    icon: 'Heart',
    description: 'Advanced adult and pediatric cardiology, coronary bypass (CABG), angioplasty, heart valve repair, and rhythm management.',
    isPopular: true,
    order: 3,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '20 Mins Emergency Pre-Auth',
      estimatedCostRange: '₹1,10,000 - ₹3,20,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Coronary Angioplasty', 'Pacemaker Implantation', 'CABG Bypass Surgery', 'Heart Valve Replacement']
  },
  {
    id: 'spec-4',
    name: 'Orthopaedics & Joint Replacement',
    type: 'speciality',
    icon: 'Bone',
    description: 'Advanced bone, joint, and musculoskeletal care, specializing in computer-navigated hip, knee, and shoulder arthroplasty.',
    isPopular: true,
    order: 4,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: 'Up to 100% Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹95,000 - ₹2,40,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Total Knee Replacement', 'Total Hip Replacement', 'Arthroscopy', 'ACL Ligament Repair']
  },
  {
    id: 'spec-5',
    name: 'Neurosciences',
    type: 'speciality',
    icon: 'Brain',
    description: 'Cutting-edge neurosurgery, stroke care, brain tumor surgeries, endoscopic spine decompression, and epilepsy treatment.',
    isPopular: true,
    order: 5,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Available',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹1,30,000 - ₹3,80,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Micro-Neurosurgery', 'Endoscopic Spine Surgery', 'Deep Brain Stimulation', 'Aneurysm Clipping']
  },
  {
    id: 'spec-6',
    name: 'Nephrology',
    type: 'speciality',
    icon: 'Kidneys',
    description: 'Expert kidney care, hemodialysis, peritoneal dialysis, kidney stone management, and renal transplantation services.',
    isPopular: true,
    order: 6,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹35,000 - ₹1,80,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['AV Fistula Creation', 'Laser Kidney Stone Removal', 'Dialysis Access', 'Renal Biopsy']
  },
  {
    id: 'spec-7',
    name: 'Internal Medicine',
    type: 'speciality',
    icon: 'Pill',
    description: 'Comprehensive primary care, chronic illness management, adult wellness, diabetes care, and infectious disease diagnostics.',
    isPopular: true,
    order: 7,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: 'Covered under Daycare / IPD',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹15,000 - ₹65,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Diagnostic Endoscopy', 'Hypertension & Diabetes Protocol', 'Infectious Disease Care']
  },
  {
    id: 'spec-8',
    name: 'Obstetrics And Gynaecology',
    type: 'speciality',
    icon: 'Baby',
    description: 'Complete women’s healthcare, high-risk pregnancy care, painless normal deliveries, robotic hysterectomy, and fertility care.',
    isPopular: true,
    order: 8,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: 'Maternity & Gynaec Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹45,000 - ₹1,10,000',
      outOfPocketWithInsurance: '₹0 with Maternity Benefit Rider',
      emiAvailable: true
    },
    procedures: ['Painless Delivery', 'Laparoscopic Hysterectomy', 'Ovarian Cystectomy', 'Fibroid Removal']
  }
];

export const initialProcedures = [
  {
    id: 'proc-1',
    name: 'Cataract Surgery',
    type: 'procedure',
    icon: 'Eye',
    description: 'Blade-free Robotic and Phacoemulsification cataract surgery with premium toric/multifocal intraocular lenses. Daycare 15-min procedure.',
    isPopular: true,
    order: 1,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered (Daycare)',
      cashlessAvailable: true,
      preAuthHours: '20 Mins Pre-Approval',
      estimatedCostRange: '₹22,000 - ₹65,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Monofocal Lens Cataract', 'Multifocal Robotic Cataract', 'Toric Astigmatism Correction']
  },
  {
    id: 'proc-2',
    name: 'Total Knee Replacement',
    type: 'procedure',
    icon: 'Bone',
    description: 'Robotic assisted joint replacement surgery for severe osteoarthritis. High-flex implants with rapid post-op mobility.',
    isPopular: true,
    order: 2,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹1,15,000 - ₹2,30,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Robotic Unilateral Knee', 'Bilateral Knee Replacement', 'Partial Knee Replacement']
  },
  {
    id: 'proc-3',
    name: 'Laparoscopic Gallbladder Removal',
    type: 'procedure',
    icon: 'Activity',
    description: 'Minimal invasive laparoscopic cholecystectomy for gallstones. Tiny 5mm incisions, same-day discharge with quick recovery.',
    isPopular: true,
    order: 3,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹45,000 - ₹85,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Laparoscopic Cholecystectomy', 'Single-Incision Gallbladder Surgery']
  },
  {
    id: 'proc-4',
    name: 'Hernia Repair Surgery',
    type: 'procedure',
    icon: 'ShieldCheck',
    description: 'Advanced 3D-mesh laparoscopic & robotic hernia repair for inguinal, umbilical, and incisional hernias.',
    isPopular: true,
    order: 4,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹40,000 - ₹80,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Laparoscopic Inguinal Hernia', 'Umbilical Hernia Mesh Repair', 'Ventral Hernia Repair']
  },
  {
    id: 'proc-5',
    name: 'Coronary Angioplasty & Stenting',
    type: 'procedure',
    icon: 'Heart',
    description: 'Trans-radial cardiac catheterization with drug-eluting stents (DES) to clear arterial blockage and restore normal blood flow.',
    isPopular: true,
    order: 5,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '15 Mins Emergency Pre-Auth',
      estimatedCostRange: '₹1,20,000 - ₹2,50,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Single Vessel Angioplasty', 'Complex Multi-vessel Stenting', 'Rotablation Angioplasty']
  },
  {
    id: 'proc-6',
    name: 'Kidney Stone Laser Removal (RIRS / PCNL)',
    type: 'procedure',
    icon: 'Kidneys',
    description: 'Holmium laser lithotripsy (RIRS) and mini-PCNL for pain-free stone dusting with zero skin cuts.',
    isPopular: true,
    order: 6,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered (Daycare/24h)',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹40,000 - ₹75,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Retrograde Intrarenal Surgery (RIRS)', 'Mini-PCNL', 'Laser Ureteroscopy (URS)']
  },
  {
    id: 'proc-7',
    name: 'Spine Disc Decompression & Fusion',
    type: 'procedure',
    icon: 'Bone',
    description: 'Endoscopic micro-discectomy and robotic spinal instrumentation for slipped disc, sciatica, and lumbar spinal canal stenosis.',
    isPopular: true,
    order: 7,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹90,000 - ₹2,20,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Endoscopic Microdiscectomy', 'Lumbar Spinal Fusion (TLIF)', 'Cervical Disc Replacement']
  },
  {
    id: 'proc-8',
    name: 'Laser Piles & Fistula Surgery',
    type: 'procedure',
    icon: 'Activity',
    description: 'Advanced German diode laser treatment for hemorrhoids, fissures, and anal fistulas. No cuts, no dressings, same-day walk home.',
    isPopular: true,
    order: 8,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered (Daycare)',
      cashlessAvailable: true,
      preAuthHours: '25 Mins Pre-Approval',
      estimatedCostRange: '₹35,000 - ₹65,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Laser Hemorrhoidoplasty (LHP)', 'FiLaC Fistula Laser Closure', 'Laser Fissurectomy']
  }
];

export const initialSpecialitiesProcedures = [
  ...initialSpecialities,
  ...initialProcedures
];
