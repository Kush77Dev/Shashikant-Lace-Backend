import User from '../models/User.js';

/**
 * Ensures a real admin User document exists in the database, backed by
 * a proper bcrypt-hashed password and role: 'admin'. Runs once on server
 * startup (after DB connect). Idempotent — safe to run on every boot.
 *
 * This replaces the previous "admin" login flow, which only set a
 * sessionStorage flag on the frontend with zero backend verification.
 * Now /admin sign-in issues a real JWT for a real admin account, so the
 * `adminOnly` middleware (used by dashboard/orders/products admin
 * endpoints) works correctly instead of blocking every request.
 */
export const ensureAdminUser = async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@shashikantlace.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'Shashikant@2026';

    let admin = await User.findOne({ email });
    if (!admin) {
      admin = await User.create({
        fullName: 'Atelier Admin',
        email,
        password,
        role: 'admin',
        is_verified: true,
        is_google: 0,
      });
      console.log(`✅ Created admin account: ${email}`);
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      admin.is_verified = true;
      await admin.save();
      console.log(`✅ Promoted existing account to admin: ${email}`);
    }
  } catch (err) {
    console.error('❌ Failed to ensure admin account:', err.message);
  }
};
