import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/admin/dashboard  (admin only)
// Aggregates the numbers the admin dashboard's stat cards, charts, and
// recent-activity table need, in a single round trip.
export const getDashboardStats = async (req, res) => {
  try {
    const [totalOrders, totalProducts, totalCustomers, revenueAgg, statusAgg, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.find().sort('-created_date').limit(6)
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    const orderStatusCounts = { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statusAgg.forEach((s) => { if (s._id in orderStatusCounts) orderStatusCounts[s._id] = s.count; });

    // Sales for the trailing 6 months (including the current month),
    // oldest first, zero-filled for months with no orders.
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    const rangeStart = new Date(months[0].year, months[0].month, 1);

    const monthlyAgg = await Order.aggregate([
      { $match: { created_date: { $gte: rangeStart }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$created_date' }, month: { $subtract: [{ $month: '$created_date' }, 1] } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      }
    ]);

    const salesByMonth = months.map(({ year, month }) => {
      const match = monthlyAgg.find((m) => m._id.year === year && m._id.month === month);
      return {
        label: MONTH_LABELS[month],
        revenue: match?.revenue || 0,
        orders: match?.orders || 0
      };
    });

    res.json({
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      orderStatusCounts,
      salesByMonth,
      recentOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users  (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp_code -otp_expires').sort('-created_date');

    // Attach a lightweight order count per user without N+1 queries.
    const orderCounts = await Order.aggregate([
      { $group: { _id: '$created_by_id', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } }
    ]);
    const countMap = new Map(orderCounts.map((o) => [String(o._id), { count: o.count, totalSpent: o.totalSpent }]));

    const withOrderStats = users.map((u) => {
      const stats = countMap.get(String(u._id)) || { count: 0, totalSpent: 0 };
      return { ...u.toObject(), orderCount: stats.count, totalSpent: stats.totalSpent };
    });

    res.json(withOrderStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
