import express from 'express';
import { getReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect, optionalProtect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, requireRole('admin', 'hospital'), updateReview);
router.delete('/:id', protect, requireRole('admin', 'hospital'), deleteReview);

export default router;
