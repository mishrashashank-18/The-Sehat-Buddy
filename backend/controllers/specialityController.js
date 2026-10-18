import SpecialityProcedure from '../models/SpecialityProcedure.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

const DEFAULT_SPECIALITIES_PROCEDURES = [
  {
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
    procedures: ['Robotic Knee Replacement', 'Robotic Prostatectomy', 'Robotic Hernia Repair']
  },
  {
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
    procedures: ['Tumor Resection', 'Chemotherapy Port Insertion', 'Surgical Oncology']
  },
  {
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
    procedures: ['Coronary Angioplasty', 'Pacemaker Implantation', 'CABG Bypass Surgery']
  },
  {
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
    procedures: ['Total Knee Replacement', 'Total Hip Replacement', 'Arthroscopy']
  },
  {
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
    procedures: ['Micro-Neurosurgery', 'Endoscopic Spine Surgery', 'Deep Brain Stimulation']
  },
  {
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
    procedures: ['AV Fistula Creation', 'Laser Kidney Stone Removal', 'Dialysis Access']
  },
  {
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
    procedures: ['Diagnostic Endoscopy', 'Hypertension & Diabetes Protocol']
  },
  {
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
    procedures: ['Painless Delivery', 'Laparoscopic Hysterectomy', 'Ovarian Cystectomy']
  },
  {
    name: 'Cataract Surgery',
    type: 'procedure',
    icon: 'Eye',
    description: 'Blade-free Robotic and Phacoemulsification cataract surgery with premium toric/multifocal intraocular lenses. Daycare 15-min procedure.',
    isPopular: true,
    order: 9,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered (Daycare)',
      cashlessAvailable: true,
      preAuthHours: '20 Mins Pre-Approval',
      estimatedCostRange: '₹22,000 - ₹65,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Monofocal Lens Cataract', 'Multifocal Robotic Cataract']
  },
  {
    name: 'Total Knee Replacement',
    type: 'procedure',
    icon: 'Bone',
    description: 'Robotic assisted joint replacement surgery for severe osteoarthritis. High-flex implants with rapid post-op mobility.',
    isPopular: true,
    order: 10,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '30 Mins Pre-Approval',
      estimatedCostRange: '₹1,15,000 - ₹2,30,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Robotic Unilateral Knee', 'Bilateral Knee Replacement']
  },
  {
    name: 'Laparoscopic Gallbladder Removal',
    type: 'procedure',
    icon: 'Activity',
    description: 'Minimal invasive laparoscopic cholecystectomy for gallstones. Tiny 5mm incisions, same-day discharge with quick recovery.',
    isPopular: true,
    order: 11,
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
    name: 'Coronary Angioplasty & Stenting',
    type: 'procedure',
    icon: 'Heart',
    description: 'Trans-radial cardiac catheterization with drug-eluting stents (DES) to clear arterial blockage and restore normal blood flow.',
    isPopular: true,
    order: 12,
    insuranceCovered: true,
    insuranceDetails: {
      coveragePercent: '100% Cashless Covered',
      cashlessAvailable: true,
      preAuthHours: '15 Mins Emergency Pre-Auth',
      estimatedCostRange: '₹1,20,000 - ₹2,50,000',
      outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
      emiAvailable: true
    },
    procedures: ['Single Vessel Angioplasty', 'Complex Multi-vessel Stenting']
  }
];

export const getSpecialitiesProcedures = async (req, res) => {
  try {
    const count = await SpecialityProcedure.countDocuments();
    if (count === 0) {
      await SpecialityProcedure.insertMany(DEFAULT_SPECIALITIES_PROCEDURES);
    }

    const { type } = req.query;
    const filter = {};
    if (type) filter.type = type;
    const items = await SpecialityProcedure.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSpecialityProcedure = async (req, res) => {
  try {
    const {
      name,
      type,
      icon,
      description,
      isPopular,
      order,
      insuranceCovered,
      insuranceDetails,
      procedures
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ success: false, message: 'Name and type are required' });
    }

    const item = await SpecialityProcedure.create({
      name,
      type,
      icon: icon || 'Bot',
      description: description || '',
      isPopular: isPopular !== undefined ? isPopular : true,
      order: order !== undefined ? Number(order) : 0,
      insuranceCovered: insuranceCovered !== undefined ? insuranceCovered : true,
      insuranceDetails: insuranceDetails || {
        coveragePercent: 'Up to 100% Covered',
        cashlessAvailable: true,
        preAuthHours: '30 Mins Pre-Approval',
        estimatedCostRange: '₹40,000 - ₹90,000',
        outOfPocketWithInsurance: '₹0 with Cashless Mediclaim',
        emiAvailable: true
      },
      procedures: Array.isArray(procedures) ? procedures : []
    });

    broadcastDbChange('specialityprocedures', 'insert', item._id, item);
    res.status(201).json({ success: true, message: 'Item created successfully', data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSpecialityProcedure = async (req, res) => {
  try {
    const item = await SpecialityProcedure.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Speciality / Procedure not found' });
    }
    Object.assign(item, req.body);
    const updated = await item.save();
    broadcastDbChange('specialityprocedures', 'update', updated._id, updated);
    res.json({ success: true, message: 'Updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSpecialityProcedure = async (req, res) => {
  try {
    const item = await SpecialityProcedure.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Speciality / Procedure not found' });
    }
    const itemId = item._id;
    await item.deleteOne();
    broadcastDbChange('specialityprocedures', 'delete', itemId);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
