import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  product_slug: { type: String, required: true },
  user_name: { type: String, required: true },
  user_email: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  verified_buyer: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Review', reviewSchema);
