import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  collectionName: { type: String },
  type: { type: String, required: true },
  image: { type: String, required: true },
  gallery: [{ type: String }],
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  color: { type: String },
  country: { type: String },
  width: { type: String },
  pattern: { type: String },
  stretch: { type: Boolean, default: false },
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  badge: { type: String },
  stock: { type: Number, default: 0 },
  isNewItem: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  material: { type: String },
  description: { type: String },
  vendor: { type: String }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.model('Product', productSchema);
