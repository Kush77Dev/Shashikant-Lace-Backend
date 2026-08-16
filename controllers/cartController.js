import Cart from '../models/Cart.js';

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user_id: req.user.id });
    res.json(cart || { cart_items: [], wishlist_items: [], applied_coupon: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/cart  (upsert entire cart)
export const saveCart = async (req, res) => {
  try {
    const { cart_items, wishlist_items, applied_coupon } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { user_id: req.user.id },
      { cart_items, wishlist_items, applied_coupon },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/cart
export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user_id: req.user.id },
      { cart_items: [], applied_coupon: null }
    );
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
