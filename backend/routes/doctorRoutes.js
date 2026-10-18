import express from 'express';
import {
  authDoctor,
  checkDoctorEmail,
  setInitialPassword,
  forgotDoctorPassword,
  verifyDoctorResetOtp,
  resetDoctorPassword,
  addDoctorByHospital,
  getDoctors,
  getDoctorById,
  doctorDashboard,
  updateDoctorProfile,
  deleteDoctorProfile
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public read routes
router.get('/list', getDoctors);
router.get('/:id', getDoctorById);

// Doctor auth & initial password setup
router.post('/login', authDoctor);
router.post('/check-email', checkDoctorEmail);
router.post('/set-initial-password', setInitialPassword);
router.post('/forgot-password', forgotDoctorPassword);
router.post('/verify-reset-otp', verifyDoctorResetOtp);
router.post('/reset-password', resetDoctorPassword);

// Hospital roster addition (authenticated)
router.post('/add-by-hospital', protect, addDoctorByHospital);

// Doctor profile update & delete (authenticated & role-checked)
router.put('/:id', protect, upload.single('image'), updateDoctorProfile);
router.delete('/:id', protect, deleteDoctorProfile);

// Dashboard (authenticated)
router.get('/dashboard', protect, doctorDashboard);

export default router;
