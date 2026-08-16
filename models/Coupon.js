import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String },
  type: { type: String, enum: ['percent', 'flat', 'ship'], required: true },
  value: { type: Number, required: true },
  min_order: { type: Number, default: 0 },
  max_discount: { type: Number },
  expiry: { type: Date },
  active: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Coupon', couponSchema);
