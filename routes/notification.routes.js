import express from 'express';
import { triggerAbandonedCartEmails } from '../controllers/notificationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/abandoned-carts', protect, adminOnly, triggerAbandonedCartEmails);

export default router;
