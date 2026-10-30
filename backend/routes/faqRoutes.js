import express from 'express';
import { getFaqs, createFaq, updateFaq, deleteFaq, reorderFaqs } from '../controllers/faqController.js';
import { getFaqSymbols, createFaqSymbol, deleteFaqSymbol } from '../controllers/faqSymbolController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Symbols endpoints for default and custom Cloudinary symbols
router.get('/symbols', getFaqSymbols);
router.post('/symbols', createFaqSymbol);
router.delete('/symbols/:id', deleteFaqSymbol);

// Standard FAQs endpoints - allow both website administrators and hospital managers
const faqProtect = (req, res, next) => {
  return protect(req, res, () => requireRole('admin', 'hospital')(req, res, next));
};

router.get('/', getFaqs);
router.put('/reorder', faqProtect, reorderFaqs);
router.post('/', faqProtect, createFaq);
router.put('/:id', faqProtect, updateFaq);
router.delete('/:id', faqProtect, deleteFaq);

export default router;
