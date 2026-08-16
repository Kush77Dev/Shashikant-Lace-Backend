import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Testimonial from '../models/Testimonial.js';

// GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort('-created_date');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories/:slug
export const getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/categories (admin)
export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/categories/:id (admin)
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/categories/:id (admin)
export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/collections
export const getCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort('-created_date');
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/collections (admin)
export const createCollection = async (req, res) => {
  try {
    const collection = await Collection.create(req.body);
    res.status(201).json(collection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/collections/:id (admin)
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/collections/:id (admin)
export const deleteCollection = async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Collection deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/testimonials
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort('-created_date');
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
