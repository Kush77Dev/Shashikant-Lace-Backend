import crypto from 'crypto';
import Order from '../models/Order.js';
import { sendOrderConfirmationEmail, sendReviewRequestEmail } from '../utils/email.js';
import { generateInvoiceBuffer } from '../utils/invoice.js';

const generateOrderNumber = () => 'SL' + Date.now().toString().slice(-8);

// POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method_type } = req.body;
    const isOnlinePayment = payment_method_type && payment_method_type !== 'cod';

    // Never trust a client-reported "paid" status for online payments —
    // re-verify the Razorpay signature server-side before persisting the order.
    if (isOnlinePayment) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment verification details' });
      }
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ message: 'Payment verification is not configured on the server' });
      }
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    }

    const orderData = {
      ...req.body,
      order_number: req.body.order_number || generateOrderNumber(),
      created_by_id: req.user?.id || null,
      payment_status: isOnlinePayment ? 'paid' : 'cod',
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

// GET /api/orders/:id/invoice  (owner or admin)
// Streams a generated PDF invoice for the order.
export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.created_by_id && req.user?.id && String(order.created_by_id) === String(req.user.id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to access this invoice' });
    }

    const pdfBuffer = await generateInvoiceBuffer(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${order.order_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Invoice generation error:', err.message);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
};
