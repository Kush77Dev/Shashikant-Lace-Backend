import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  order_number: { type: String, required: true, unique: true },
  created_by_id: { type: String },
  customer: {
    fullName: { type: String, default: 'Valued Customer' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    yards: Number,
    image: String,
    color: String
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  applied_coupon: { type: String },
  payment_method: { type: String, default: 'cod' },
  payment_method_type: { type: String, enum: ['card', 'upi', 'netbanking', 'cod'], default: 'cod' },
  payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'cod'], default: 'pending' },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'confirmed' },
  tracking_number: { type: String },
  estimated_delivery: { type: Date }
}, {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

export default mongoose.model('Order', orderSchema);
