import express from 'express';
import { getCart, saveCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getCart);
router.put('/', protect, saveCart);
router.delete('/', protect, clearCart);

export default router;
