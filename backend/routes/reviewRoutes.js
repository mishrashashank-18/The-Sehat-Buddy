import express from 'express';
import { getReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, requireAdmin, updateReview);
router.delete('/:id', protect, requireAdmin, deleteReview);

export default router;
