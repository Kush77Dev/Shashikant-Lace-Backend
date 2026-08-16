import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  cart_items: { type: Array, default: [] },
  wishlist_items: { type: Array, default: [] },
  applied_coupon: { type: Object, default: null },
  last_abandoned_email_sent: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Cart', cartSchema);
