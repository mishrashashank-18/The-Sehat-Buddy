import express from 'express';
import {
  getSpecialitiesProcedures,
  createSpecialityProcedure,
  updateSpecialityProcedure,
  deleteSpecialityProcedure
} from '../controllers/specialityController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
const requireHospitalOrAdmin = requireRole('admin', 'hospital');

router.get('/', getSpecialitiesProcedures);
router.post('/', protect, requireHospitalOrAdmin, createSpecialityProcedure);
router.put('/:id', protect, requireHospitalOrAdmin, updateSpecialityProcedure);
router.delete('/:id', protect, requireHospitalOrAdmin, deleteSpecialityProcedure);

export default router;
