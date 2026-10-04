import express from 'express';
import { authAdmin, registerAdmin, addDoctor, allDoctors, getDashboardData } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.post('/login', authAdmin);
router.post('/register', registerAdmin);
router.post('/add-doctor', protect, upload.single('image'), addDoctor);
router.get('/all-doctors', protect, allDoctors);
router.get('/dashboard', protect, getDashboardData);

export default router;
