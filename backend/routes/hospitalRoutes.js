import express from 'express';
import {
  authHospital,
  checkHospitalEmail,
  setInitialHospitalPassword,
  forgotHospitalPassword,
  verifyHospitalResetOtp,
  resetHospitalPassword,
  registerHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  updateDoctorFaqsByHospital
} from '../controllers/hospitalController.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/list', getHospitals);
router.get('/:id', getHospitalById);

// Auth & initial password setup
router.post('/register', upload.single('image'), registerHospital);
router.post('/login', authHospital);
router.post('/check-email', checkHospitalEmail);
router.post('/set-initial-password', setInitialHospitalPassword);
router.post('/forgot-password', forgotHospitalPassword);
router.post('/verify-reset-otp', verifyHospitalResetOtp);
router.post('/reset-password', resetHospitalPassword);

// Admin / Management
router.put('/:id', upload.single('image'), updateHospital);
router.delete('/:id', deleteHospital);

// Hospital updating registered doctor FAQs
router.put('/:hospitalId/doctor-faqs/:doctorId', updateDoctorFaqsByHospital);

export default router;
