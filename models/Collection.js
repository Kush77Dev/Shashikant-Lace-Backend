import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: { type: String },
  image: { type: String, required: true },
  count: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Collection', collectionSchema);
