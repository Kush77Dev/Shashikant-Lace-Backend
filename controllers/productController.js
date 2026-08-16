import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { sendBackInStockEmail } from '../utils/email.js';

// GET /api/products  (supports ?category=, ?collection=, ?search=, ?trending=true, ?limit=)
export const getProducts = async (req, res) => {
  try {
    const { category, collectionName, search, trending, isNew, limit = 200, sort = '-created_date' } = req.query;
    const query = {};
    if (category) query.category = category;
    if (collectionName) query.collectionName = collectionName;
    if (trending === 'true') query.trending = true;
    if (isNew === 'true') query.isNewItem = true;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { type: { $regex: search, $options: 'i' } },
      { badge: { $regex: search, $options: 'i' } }
    ];

    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/products/slug/:slug
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/products  (admin only)
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/products/:id  (admin only)
export const updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if product was restocked from 0 to >0
    if (existing && existing.stock === 0 && product.stock > 0) {
      (async () => {
        try {
          const carts = await Cart.find({
            $or: [
              { 'cart_items.id': product.id || product._id },
              { 'wishlist_items.id': product.id || product._id }
            ]
          });
          for (const cartRecord of carts) {
            const user = await User.findById(cartRecord.user_id);
            if (user && user.email) {
              await sendBackInStockEmail({ to: user.email, name: user.fullName, product });
            }
          }
        } catch (err) {
          console.error('Restock email error:', err.message);
        }
      })();
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/products/:id  (admin only)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
