import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', protect, createReview);
router.delete('/:id', protect, adminOnly, deleteReview);

export default router;
