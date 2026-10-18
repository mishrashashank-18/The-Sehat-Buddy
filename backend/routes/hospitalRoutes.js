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
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/', getHospitals);
router.get('/list', getHospitals);
router.get('/:id', getHospitalById);

// Auth & initial password setup
router.post('/login', authHospital);
router.post('/check-email', checkHospitalEmail);
router.post('/set-initial-password', setInitialHospitalPassword);
router.post('/forgot-password', forgotHospitalPassword);
router.post('/verify-reset-otp', verifyHospitalResetOtp);
router.post('/reset-password', resetHospitalPassword);

// Hospital registration (Admin only)
router.post('/register', protect, requireAdmin, upload.single('image'), registerHospital);

// Hospital profile management (Hospital or Admin)
router.put('/:id', protect, upload.single('image'), updateHospital);
router.delete('/:id', protect, requireAdmin, deleteHospital);

// Hospital updating registered doctor FAQs (Hospital or Admin)
router.put('/:hospitalId/doctor-faqs/:doctorId', protect, updateDoctorFaqsByHospital);

export default router;
