import express from 'express';
import { authHospital, registerHospital, getHospitals, getHospitalById, updateHospital, deleteHospital } from '../controllers/hospitalController.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

// Public routes
router.get('/list', getHospitals);
router.get('/:id', getHospitalById);

// Auth
router.post('/register', upload.single('image'), registerHospital);
router.post('/login', authHospital);

// Admin / Management
router.put('/:id', upload.single('image'), updateHospital);
router.delete('/:id', deleteHospital);

export default router;
