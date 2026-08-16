import Review from '../models/Review.js';

// GET /api/reviews?product_slug=
export const getReviews = async (req, res) => {
  try {
    const query = {};
    if (req.query.product_slug) query.product_slug = req.query.product_slug;
    const reviews = await Review.find(query).sort('-created_date');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const review = await Review.create(req.body);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/reviews/:id (admin)
export const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
