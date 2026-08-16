import Coupon from '../models/Coupon.js';

// GET /api/coupons  (public)
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ active: true }).sort('-created_date');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/coupons/validate  (public)
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), active: true });

    if (!coupon) return res.status(404).json({ valid: false, message: 'Invalid coupon code' });
    if (coupon.expiry && new Date(coupon.expiry) < new Date())
      return res.status(400).json({ valid: false, message: 'This coupon has expired' });
    if (subtotal < (coupon.min_order || 0))
      return res.status(400).json({ valid: false, message: `Minimum order ₹${coupon.min_order} required` });

    let discount = 0;
    let freeShip = false;
    if (coupon.type === 'ship') {
      freeShip = true;
    } else if (coupon.type === 'percent') {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    } else {
      discount = coupon.value;
    }

    res.json({ valid: true, coupon, discount, freeShip });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/coupons (admin)
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/coupons/:id (admin)
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/coupons/:id (admin)
export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
