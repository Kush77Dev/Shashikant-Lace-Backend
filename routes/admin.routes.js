import express from 'express';
import { getDashboardStats, getUsers } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getUsers);

export default router;
