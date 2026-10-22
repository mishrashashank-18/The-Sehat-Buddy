import express from 'express';
import { registerUser, authUser, googleLogin, getProfile, updateProfile, bookAppointment, bookHospitalAppointment, listAppointments, cancelAppointment, verifyOtp } from '../controllers/userController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-otp', verifyOtp);
router.post('/google-login', googleLogin);
router.get('/profile', protect, getProfile);
router.post('/update-profile', protect, upload.single('image'), updateProfile);
router.post('/book-appointment', optionalProtect, bookAppointment);
router.post('/book-hospital-appointment', optionalProtect, bookHospitalAppointment);
router.get('/appointments', protect, listAppointments);
router.post('/cancel-appointment', protect, cancelAppointment);

export default router;
