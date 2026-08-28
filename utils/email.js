import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { generateInvoiceBuffer } from './invoice.js';

// Transporter configuration for Gmail with automatic credentials fallback
const createTransporter = () => {
  const user = process.env.SMTP_USER || 'shashikantlace@gmail.com';
  const pass = (process.env.SMTP_PASS || 'oxrwzntiesdztuuj').replace(/\s+/g, '');

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return {
    sendMail: async (options) => {
      console.log('--- 📧 [EMAIL NOTIFICATION DEV LOG] ---');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Body Summary:', options.text || '[Luxury HTML Email Content]');
      console.log('--------------------------------------');
      return { messageId: 'dev-mode-mock-id' };
    }
  };
};

const transporter = createTransporter();
const FROM_EMAIL = process.env.FROM_EMAIL || '"Shashikant Lace Atelier" <shashikantlace@gmail.com>';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CID Attachment Helper for 100% Reliable Inline White Logo in Gmail/Outlook
const getAttachments = () => {
  const whiteLogoPath = path.join(process.cwd(), 'assets', 'logo_white.png');
  const fallbackLogoPath = path.join(process.cwd(), 'assets', 'logo.png');
  const targetPath = fs.existsSync(whiteLogoPath) ? whiteLogoPath : (fs.existsSync(fallbackLogoPath) ? fallbackLogoPath : null);

  if (targetPath) {
    return [{
      filename: 'logo.png',
      path: targetPath,
      cid: 'shashikant_logo_white'
    }];
  }
  return [];
};

/**
 * 1. Order Confirmation Email
 */
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const customerEmail = order.customer_email || order.customer?.email || order.shipping_address?.email;
    const customerName = order.customer_name || order.customer?.fullName || 'Valued Customer';
    if (!customerEmail) return;

    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td style="padding: 16px; border-bottom: 1px solid #F1F5F9;">
          <strong style="color: #0F172A; font-size: 14px;">${item.name}</strong><br/>
          <span style="color: #64748B; font-size: 12px;">${item.color ? `Color: ${item.color} | ` : ''}Qty: ${item.quantity || item.qty || 1}yd</span>
        </td>
        <td style="padding: 16px; border-bottom: 1px solid #F1F5F9; text-align: right; color: #0F172A; font-weight: 600; font-size: 14px;">
          ₹${Math.round((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 40px 32px;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 6px 0;">ORDER CONFIRMED</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #0F172A; margin: 0 0 16px 0; font-weight: 400;">Thank you for your order, ${customerName}.</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your order <strong style="color: #0F172A;">#${order.order_number}</strong> has been received and is being prepared with high craftsmanship by our atelier master weavers. A copy of your invoice is attached to this email as a PDF.</p>

            <div style="background-color: #FAF9F6; border: 1px solid #E2E8F0; padding: 18px 24px; border-radius: 4px; margin-bottom: 28px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
                <tr><td><strong>Order Number:</strong> #${order.order_number}</td><td style="text-align: right;"><strong>Payment:</strong> ${order.payment_method || 'Paid'}</td></tr>
              </table>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #F8FAFC; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                  <th style="padding: 10px 16px; text-align: left;">Item Description</th>
                  <th style="padding: 10px 16px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div style="margin-top: 24px; border-top: 2px solid #F1F5F9; padding-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #475569;"><span>Subtotal</span><span>₹${Math.round(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
              ${order.discount ? `<div style="display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #16A34A;"><span>Discount</span><span>-₹${Math.round(order.discount).toLocaleString('en-IN')}</span></div>` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #475569;"><span>Shipping</span><span>${order.shipping ? `₹${Math.round(order.shipping).toLocaleString('en-IN')}` : 'FREE'}</span></div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 4px 0; color: #475569;"><span>GST (5%)</span><span>₹${Math.round(order.tax || 0).toLocaleString('en-IN')}</span></div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #0F172A; padding-top: 12px; margin-top: 8px; border-top: 1px solid #E2E8F0;"><span>Total Amount</span><span style="color: #D97706;">₹${Math.round(order.total || 0).toLocaleString('en-IN')}</span></div>
            </div>

            <div style="text-align: center; margin-top: 36px;">
              <a href="${CLIENT_URL}/track?order=${order.order_number}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-radius: 2px;">Track Your Order</a>
            </div>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    // Attach the PDF invoice alongside the CID logo. If PDF generation
    // fails for any reason, still send the confirmation email without it
    // rather than blocking the whole notification.
    let invoiceAttachment = [];
    try {
      const invoiceBuffer = await generateInvoiceBuffer(order);
      invoiceAttachment = [{
        filename: `Invoice-${order.order_number}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf',
      }];
    } catch (invoiceErr) {
      console.error('❌ Failed to generate invoice PDF for email:', invoiceErr.message);
    }

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Order Confirmation #${order.order_number} — Shashikant Lace`,
      html,
      attachments: [...getAttachments(), ...invoiceAttachment],
    });
    console.log(`✅ Order confirmation email sent to ${customerEmail} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send order email:', error.message);
  }
};

// Brand Header & Footer HTML Partial
const brandHeaderHtml = `
  <div style="background-color: #0F172A; text-align: center; padding: 32px 20px; border-bottom: 2px solid #D97706;">
    <div style="margin-bottom: 10px;">
      <img src="cid:shashikant_logo_white" alt="Shashikant Lace" style="height: 58px; max-width: 260px; width: auto; display: inline-block; border: none; outline: none;" />
    </div>
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9px; color: #94A3B8; text-transform: uppercase; letter-spacing: 4px; margin-top: 4px;">
      FINE FABRICS & HERITAGE TRIMMINGS
    </div>
  </div>
`;

const brandFooterHtml = `
  <div style="background-color: #0F172A; color: #94A3B8; text-align: center; padding: 30px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.8; border-top: 1px solid #1E293B;">
    <p style="color: #F8FAFC; font-family: Georgia, serif; font-size: 14px; margin-bottom: 8px; letter-spacing: 1px;">SHASHIKANT LACE ATELIER</p>
    <p style="margin: 0 0 10px 0;">Atelier No. 7, Heritage Lane, Mumbai, Maharashtra 400001 · India</p>
    <p style="margin: 0; color: #64748B;">© ${new Date().getFullYear()} Shashikant Lace. All rights reserved.</p>
  </div>
`;

/**
 * OTP Verification Email
 */
export const sendOtpEmail = async (to, otpCode, name = 'Valued Couturier') => {
  try {
    if (!to || !otpCode) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 44px 36px; text-align: center;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; margin: 0 0 10px 0;">VERIFICATION CODE</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #0F172A; margin: 0 0 16px 0; font-weight: 400;">Confirm your email address, ${name}.</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 auto 24px auto; max-width: 460px;">
              Please use the 6-digit verification code below to verify your email address and activate your account. This code is valid for 10 minutes.
            </p>

            <div style="background-color: #0F172A; color: #D97706; font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 12px; padding: 20px 30px; border-radius: 4px; display: inline-block; margin-bottom: 24px;">
              ${otpCode}
            </div>

            <p style="font-size: 12px; color: #64748B; margin: 0;">If you did not request this verification code, please ignore this email.</p>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `${otpCode} is your Shashikant Lace verification code`,
      html,
      attachments: getAttachments(),
    });
    console.log(`✅ Verification OTP email sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw error;
  }
};

/**
 * 2. Welcome Email
 */
export const sendWelcomeEmail = async (user) => {
  try {
    const userEmail = user.email;
    const userName = user.fullName || 'Valued Couturier';
    if (!userEmail) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 44px 36px; text-align: center;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; margin: 0 0 10px 0;">WELCOME TO THE ATELIER</p>
            <h2 style="font-family: Georgia, serif; font-size: 28px; color: #0F172A; margin: 0 0 18px 0; font-weight: 400;">We are honoured to welcome you, ${userName}.</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0 auto 28px auto; max-width: 480px;">
              Thank you for registering with Shashikant Lace. Discover our hand-sourced Chantilly, guipure, and embroidered weaves crafted for modern bridal and couture silhouettes.
            </p>
            <a href="${CLIENT_URL}/catalog" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-radius: 2px;">Explore The Collection</a>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Welcome to Shashikant Lace, ${userName}`,
      html,
      attachments: getAttachments(),
    });
    console.log(`✅ Welcome email sent to ${userEmail} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
  }
};

/**
 * 3. Abandoned Cart Recovery Email
 */
export const sendAbandonedCartEmail = async ({ to, name, cartItems }) => {
  try {
    if (!to || !cartItems || cartItems.length === 0) return;

    const itemsHtml = cartItems.slice(0, 3).map(item => `
      <div style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #F1F5F9;">
        ${item.image ? `<img src="${item.image}" style="width: 56px; height: 70px; object-fit: cover; border-radius: 2px; margin-right: 16px;" />` : ''}
        <div style="flex: 1;">
          <strong style="color: #0F172A; font-size: 14px; display: block;">${item.name}</strong>
          <span style="color: #64748B; font-size: 12px;">₹${Math.round(item.price || 0).toLocaleString('en-IN')}/yd</span>
        </div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 40px 32px;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 6px 0;">YOUR SELECTION IS SAVED</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #0F172A; margin: 0 0 16px 0; font-weight: 400;">Your curated weaves are waiting, ${name || 'Valued Customer'}.</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">You left exquisite items in your shopping bag. We have reserved them for you so you can complete your atelier order seamlessly.</p>

            <div style="background-color: #FAF9F6; border: 1px solid #E2E8F0; padding: 16px 20px; border-radius: 4px; margin-bottom: 28px;">
              ${itemsHtml}
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <a href="${CLIENT_URL}/checkout" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-radius: 2px;">Complete Your Order</a>
            </div>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Your curated weaves are waiting — Shashikant Lace`,
      html,
      attachments: getAttachments(),
    });
    console.log(`✅ Abandoned cart email sent to ${to} (ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send abandoned cart email:', error.message);
  }
};

/**
 * 4. Back In Stock Alert Email
 */
export const sendBackInStockEmail = async ({ to, name, product }) => {
  try {
    if (!to || !product) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 40px 32px; text-align: center;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 6px 0;">BACK IN STOCK</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #0F172A; margin: 0 0 16px 0; font-weight: 400;">Good news, ${name || 'Couturier'}.</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">The weave you liked — <strong style="color: #0F172A;">${product.name}</strong> — has been freshly restocked in our atelier inventory.</p>

            ${product.image ? `<img src="${product.image}" style="max-width: 220px; height: auto; border-radius: 4px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />` : ''}
            
            <p style="font-size: 16px; color: #D97706; font-weight: 600; margin-bottom: 24px;">₹${Math.round(product.price || 0).toLocaleString('en-IN')}/yd</p>

            <a href="${CLIENT_URL}/product/${product.id || product._id}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-radius: 2px;">Order Now Before Stock Runs Out</a>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: `Back in Stock: ${product.name} — Shashikant Lace`,
      html,
      attachments: getAttachments(),
    });
    console.log(`✅ Back in stock email sent to ${to} for ${product.name}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send back in stock email:', error.message);
  }
};

/**
 * 5. Review Request Email
 */
export const sendReviewRequestEmail = async (order) => {
  try {
    const customerEmail = order.customer_email || order.customer?.email || order.shipping_address?.email;
    const customerName = order.customer_name || order.customer?.fullName || 'Valued Customer';
    if (!customerEmail) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <div style="max-width: 620px; margin: 30px auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06);">
          ${brandHeaderHtml}
          <div style="padding: 40px 32px; text-align: center;">
            <p style="color: #D97706; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin: 0 0 6px 0;">ATELIER REVIEW</p>
            <h2 style="font-family: Georgia, serif; font-size: 26px; color: #0F172A; margin: 0 0 16px 0; font-weight: 400;">How are you enjoying your weaves, ${customerName}?</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your recent order <strong style="color: #0F172A;">#${order.order_number}</strong> was delivered. We would love to hear your thoughts and feedback on the fabric quality and craftsmanship.</p>

            <a href="${CLIENT_URL}/account?tab=reviews" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; text-decoration: none; padding: 14px 32px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; border-radius: 2px;">Write A Review</a>
          </div>
          ${brandFooterHtml}
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `How are you enjoying your weaves? — Shashikant Lace`,
      html,
      attachments: getAttachments(),
    });
    console.log(`✅ Review request email sent to ${customerEmail}`);
    return info;
  } catch (error) {
    console.error('❌ Failed to send review request email:', error.message);
  }
};
