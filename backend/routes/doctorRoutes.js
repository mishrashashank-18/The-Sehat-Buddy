import express from 'express';
import { authDoctor, getDoctors, getDoctorById, doctorDashboard } from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/list', getDoctors);
router.get('/:id', getDoctorById);

// Doctor routes
router.post('/login', authDoctor);
router.get('/dashboard', protect, doctorDashboard);

export default router;
