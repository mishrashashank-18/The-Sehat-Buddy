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
  getMyHospital,
  updateHospital,
  deleteHospital,
  updateDoctorFaqsByHospital,
  getHospitalBeds,
  updateHospitalBeds,
  removeDoctorFromHospital
} from '../controllers/hospitalController.js';
import { protect, optionalProtect, requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public routes & Authenticated profile
router.get('/', optionalProtect, getHospitals);
router.get('/list', optionalProtect, getHospitals);
router.get('/me', protect, getMyHospital);
router.get('/:id', optionalProtect, getHospitalById);
router.get('/:id/beds', getHospitalBeds);

// Auth & initial password setup
router.post('/login', authHospital);
router.post('/check-email', checkHospitalEmail);
router.post('/set-initial-password', setInitialHospitalPassword);
router.post('/forgot-password', forgotHospitalPassword);
router.post('/verify-reset-otp', verifyHospitalResetOtp);
router.post('/reset-password', resetHospitalPassword);

// Hospital registration (Admin only)
router.post('/register', protect, requireAdmin, upload.single('image'), registerHospital);

// Hospital live bed capacity (Authenticated hospital itself or Admin)
router.put('/:id/beds', protect, updateHospitalBeds);

// Hospital profile management (Hospital itself or Admin)
router.put('/:id', protect, upload.single('image'), updateHospital);
router.delete('/:id', protect, requireAdmin, deleteHospital);

// Doctor roster management for hospital (Hospital itself or Admin)
router.delete('/:id/doctors/:doctorId', protect, removeDoctorFromHospital);

// Doctor FAQs management (Admin only)
router.put('/:hospitalId/doctor-faqs/:doctorId', protect, requireAdmin, updateDoctorFaqsByHospital);

export default router;
