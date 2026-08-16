import Order from '../models/Order.js';
import { sendOrderConfirmationEmail, sendReviewRequestEmail } from '../utils/email.js';

const generateOrderNumber = () => 'SL' + Date.now().toString().slice(-8);

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      order_number: req.body.order_number || generateOrderNumber(),
      created_by_id: req.user?.id || null
    };
    const order = await Order.create(orderData);

    // Send order confirmation email asynchronously
    sendOrderConfirmationEmail(order).catch((err) =>
      console.error('Order email error:', err.message)
    );

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/orders  (user's own orders)
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ created_by_id: req.user.id }).sort('-created_date');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/orders/number/:orderNumber
export const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ order_number: req.params.orderNumber });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/orders/:id/status  (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.body.status === 'delivered') {
      sendReviewRequestEmail(order).catch((err) =>
        console.error('Review email error:', err.message)
      );
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/orders/admin/all  (admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort('-created_date');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
