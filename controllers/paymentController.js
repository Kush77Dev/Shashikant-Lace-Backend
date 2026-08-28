import crypto from 'crypto';
import Razorpay from 'razorpay';

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
// Creates a Razorpay order for the given amount (in rupees). Amount is
// converted to paise (smallest currency unit) as required by Razorpay.
export const createRazorpayOrder = async (req, res) => {
  try {
    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server' });
    }

    const { amount, currency = 'INR', receipt } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const order = await instance.orders.create({
      amount: Math.round(numericAmount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: { user_id: req.user?.id ? String(req.user.id) : 'guest' },
    });

    res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err.message);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
};

// POST /api/payments/verify
// Verifies the Razorpay payment signature returned by the checkout widget.
// This must pass before an order is considered paid.
export const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay is not configured on the server' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    res.json({ success: true, razorpay_order_id, razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
