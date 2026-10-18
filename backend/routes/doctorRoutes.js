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

// Public routes
router.get('/list', getDoctors);
router.get('/:id', getDoctorById);

// Doctor auth & initial password setup
router.post('/login', authDoctor);
router.post('/check-email', checkDoctorEmail);
router.post('/set-initial-password', setInitialPassword);
router.post('/forgot-password', forgotDoctorPassword);
router.post('/verify-reset-otp', verifyDoctorResetOtp);
router.post('/reset-password', resetDoctorPassword);
router.post('/add-by-hospital', addDoctorByHospital);

// Doctor profile update & delete
router.put('/:id', upload.single('image'), updateDoctorProfile);
router.delete('/:id', deleteDoctorProfile);

// Dashboard
router.get('/dashboard', protect, doctorDashboard);

export default router;
