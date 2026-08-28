import express from 'express';
import {
  createOrder, getMyOrders, getOrderById, getOrderByNumber,
  updateOrderStatus, getAllOrders, downloadInvoice
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/number/:orderNumber', protect, getOrderByNumber);
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
