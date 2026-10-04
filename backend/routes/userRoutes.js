import express from 'express';
import { registerUser, authUser, googleLogin, getProfile, updateProfile, bookAppointment, listAppointments, cancelAppointment } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google-login', googleLogin);
router.get('/profile', protect, getProfile);
router.post('/update-profile', protect, upload.single('image'), updateProfile);
router.post('/book-appointment', protect, bookAppointment);
router.get('/appointments', protect, listAppointments);
router.post('/cancel-appointment', protect, cancelAppointment);

export default router;
