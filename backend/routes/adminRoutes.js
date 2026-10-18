import express from 'express';
import {
  authAdmin,
  registerAdmin,
  addDoctor,
  allDoctors,
  getDashboardData,
  updateDoctor,
  deleteDoctor,
  getStorageStats
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Optional auth helper to populate req.user if Bearer token is provided
const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.post('/login', authAdmin);
router.post('/register', optionalProtect, registerAdmin);
router.post('/add-doctor', protect, requireAdmin, upload.single('image'), addDoctor);
router.put('/update-doctor/:id', protect, requireAdmin, upload.single('image'), updateDoctor);
router.delete('/delete-doctor/:id', protect, requireAdmin, deleteDoctor);
router.get('/all-doctors', protect, requireAdmin, allDoctors);
router.get('/dashboard', protect, requireAdmin, getDashboardData);
router.get('/storage-stats', protect, requireAdmin, getStorageStats);

export default router;
