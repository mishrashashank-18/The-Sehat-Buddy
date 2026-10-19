import express from 'express';
import { subscribeNewsletter, listSubscribers } from '../controllers/newsletterController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public subscription endpoint
router.post('/subscribe', subscribeNewsletter);

// Admin-only view all subscribers
const checkAdmin = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  return protect(req, res, () => requireAdmin(req, res, next));
};

router.get('/list', checkAdmin, listSubscribers);

export default router;
