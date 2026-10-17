import express from 'express';
import {
  getSpecialitiesProcedures,
  createSpecialityProcedure,
  updateSpecialityProcedure,
  deleteSpecialityProcedure
} from '../controllers/specialityController.js';

const router = express.Router();

router.get('/', getSpecialitiesProcedures);
router.post('/', createSpecialityProcedure);
router.put('/:id', updateSpecialityProcedure);
router.delete('/:id', deleteSpecialityProcedure);

export default router;
