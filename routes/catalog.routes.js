import express from 'express';
import {
  getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
  getCollections, createCollection, updateCollection, deleteCollection,
  getTestimonials
} from '../controllers/catalogController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Categories
router.get('/categories', getCategories);
router.get('/categories/:slug', getCategoryBySlug);
router.post('/categories', protect, adminOnly, createCategory);
router.put('/categories/:id', protect, adminOnly, updateCategory);
router.delete('/categories/:id', protect, adminOnly, deleteCategory);

// Collections
router.get('/collections', getCollections);
router.post('/collections', protect, adminOnly, createCollection);
router.put('/collections/:id', protect, adminOnly, updateCollection);
router.delete('/collections/:id', protect, adminOnly, deleteCollection);

// Testimonials (public read)
router.get('/testimonials', getTestimonials);

export default router;
