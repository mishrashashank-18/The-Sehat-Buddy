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
  updateDoctorAppointmentStatus,
  createDoctorAppointment,
  deleteDoctorAppointment,
  updateDoctorProfile,
  deleteDoctorProfile
} from '../controllers/doctorController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public read routes & Dashboard
router.get('/', getDoctors);
router.get('/list', getDoctors);
router.get('/dashboard', optionalProtect, doctorDashboard);
router.get('/:id', getDoctorById);

// Appointment status update by doctor
router.put('/appointments/:id/status', optionalProtect, updateDoctorAppointmentStatus);
router.post('/appointments', optionalProtect, createDoctorAppointment);
router.delete('/appointments/:id', optionalProtect, deleteDoctorAppointment);

// Doctor auth & initial password setup
router.post('/login', authDoctor);
router.post('/check-email', checkDoctorEmail);
router.post('/set-initial-password', setInitialPassword);
router.post('/forgot-password', forgotDoctorPassword);
router.post('/verify-reset-otp', verifyDoctorResetOtp);
router.post('/reset-password', resetDoctorPassword);

// Hospital roster addition (authenticated)
router.post('/add-by-hospital', protect, addDoctorByHospital);

// Doctor profile update & delete (optionalProtect allows dashboard edits in local/dev sessions while protecting in strict prod)
router.put('/:id', optionalProtect, upload.single('image'), updateDoctorProfile);
router.delete('/:id', optionalProtect, deleteDoctorProfile);

export default router;
