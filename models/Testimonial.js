import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String },
  text: { type: String, required: true },
  rating: { type: Number, default: 5 },
  avatar: { type: String }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Testimonial', testimonialSchema);
