import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { sendAbandonedCartEmail } from '../utils/email.js';

/**
 * Process Abandoned Carts
 * Finds active carts updated > 30 minutes ago where checkout was not completed,
 * and sends an abandoned cart email (max once per 24 hours per user).
 */
export const checkAndSendAbandonedCarts = async () => {
  try {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const carts = await Cart.find({
      'cart_items.0': { $exists: true },
      updated_date: { $lte: thirtyMinsAgo },
      $or: [
        { last_abandoned_email_sent: null },
        { last_abandoned_email_sent: { $lte: twentyFourHoursAgo } }
      ]
    });

    let sentCount = 0;
    for (const cartRecord of carts) {
      if (!cartRecord.cart_items || cartRecord.cart_items.length === 0) continue;

      const user = await User.findById(cartRecord.user_id);
      if (user && user.email) {
        await sendAbandonedCartEmail({
          to: user.email,
          name: user.fullName,
          cartItems: cartRecord.cart_items
        });
        cartRecord.last_abandoned_email_sent = new Date();
        await cartRecord.save();
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(`🛒 [ABANDONED CART JOB] Sent recovery email to ${sentCount} user(s).`);
    }
    return sentCount;
  } catch (err) {
    console.error('❌ Abandoned cart job error:', err.message);
    return 0;
  }
};

// API Endpoint for manual trigger (Admin dashboard or cron job)
export const triggerAbandonedCartEmails = async (req, res) => {
  try {
    const sentCount = await checkAndSendAbandonedCarts();
    res.json({ message: `Abandoned cart job executed. Emails sent to ${sentCount} user(s).` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
