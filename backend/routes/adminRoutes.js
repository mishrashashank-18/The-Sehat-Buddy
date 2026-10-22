import express from 'express';
import {
  authAdmin,
  registerAdmin,
  addDoctor,
  allDoctors,
  getDashboardData,
  updateDoctor,
  deleteDoctor,
  getStorageStats,
  streamStorageStats,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment
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

// Helper to verify admin with safe fallback in development
const adminProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, (err) => {
      if (err && process.env.NODE_ENV !== 'production') return next();
      if (err) return next(err);
      if (req.user && req.user.role === 'admin') return next();
      if (process.env.NODE_ENV !== 'production') return next();
      return requireAdmin(req, res, next);
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  return protect(req, res, () => requireAdmin(req, res, next));
};

router.post('/login', authAdmin);
router.post('/register', optionalProtect, registerAdmin);
router.post('/add-doctor', adminProtect, upload.single('image'), addDoctor);
router.put('/update-doctor/:id', adminProtect, upload.single('image'), updateDoctor);
router.delete('/delete-doctor/:id', adminProtect, deleteDoctor);
router.get('/all-doctors', adminProtect, allDoctors);
router.get('/dashboard', adminProtect, getDashboardData);
router.get('/appointments', adminProtect, getAllAppointments);
router.put('/appointments/:id/status', adminProtect, updateAppointmentStatus);
router.delete('/appointments/:id', adminProtect, deleteAppointment);
router.get('/storage-stats', adminProtect, getStorageStats);
router.get('/storage-stream', streamStorageStats);

export default router;
