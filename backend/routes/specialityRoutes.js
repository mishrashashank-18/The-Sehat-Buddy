import express from 'express';
import {
  getSpecialitiesProcedures,
  createSpecialityProcedure,
  updateSpecialityProcedure,
  deleteSpecialityProcedure
} from '../controllers/specialityController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getSpecialitiesProcedures);
router.post('/', protect, requireAdmin, createSpecialityProcedure);
router.put('/:id', protect, requireAdmin, updateSpecialityProcedure);
router.delete('/:id', protect, requireAdmin, deleteSpecialityProcedure);

export default router;
