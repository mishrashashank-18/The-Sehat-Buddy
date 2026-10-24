import express from 'express';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faqController.js';
import { getFaqSymbols, createFaqSymbol, deleteFaqSymbol } from '../controllers/faqSymbolController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Symbols endpoints for default and custom Cloudinary symbols
router.get('/symbols', getFaqSymbols);
router.post('/symbols', createFaqSymbol);
router.delete('/symbols/:id', deleteFaqSymbol);

// Standard FAQs endpoints
router.get('/', getFaqs);
router.post('/', protect, requireAdmin, createFaq);
router.put('/:id', protect, requireAdmin, updateFaq);
router.delete('/:id', protect, requireAdmin, deleteFaq);

export default router;
