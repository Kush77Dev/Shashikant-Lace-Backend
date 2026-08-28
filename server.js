import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import cartRoutes from './routes/cart.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { checkAndSendAbandonedCarts } from './controllers/notificationController.js';
import { ensureAdminUser } from './config/ensureAdmin.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// --- Middleware ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === CLIENT_URL || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api', catalogRoutes);           // /api/categories, /api/collections, /api/testimonials
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'Shashikant Lace Backend', time: new Date().toISOString() });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// --- Connect DB & Start ---
connectDB().then(async () => {
  await ensureAdminUser();
  app.listen(PORT, () => {
    console.log(`\n🚀 Shashikant Lace API running on http://localhost:${PORT}`);
    console.log(`📦 Endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/products`);
    console.log(`   GET  http://localhost:${PORT}/api/categories`);
    console.log(`   GET  http://localhost:${PORT}/api/collections`);
    console.log(`   GET  http://localhost:${PORT}/api/coupons`);
    console.log(`   GET  http://localhost:${PORT}/api/orders/my`);
    console.log(`   POST http://localhost:${PORT}/api/payments/create-order`);

    // Start background abandoned cart recovery check (runs every 15 minutes)
    setInterval(() => {
      checkAndSendAbandonedCarts().catch(() => {});
    }, 15 * 60 * 1000);
  });
});
