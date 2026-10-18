import express from 'express';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faqController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getFaqs);
router.post('/', protect, requireAdmin, createFaq);
router.put('/:id', protect, requireAdmin, updateFaq);
router.delete('/:id', protect, requireAdmin, deleteFaq);

export default router;
