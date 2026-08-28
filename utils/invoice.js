import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

// Brand palette (kept consistent with utils/email.js templates)
const NAVY = '#0F172A';
const GOLD = '#D97706';
const SLATE = '#475569';
const SLATE_LIGHT = '#94A3B8';
const MUTED = '#64748B';
const BORDER = '#E2E8F0';
const BG_LIGHT = '#FAF9F6';
const GREEN = '#16A34A';

// Note: PDFKit's built-in Helvetica font does not include the ₹ glyph,
// so amounts are prefixed with "Rs." rather than the rupee symbol to
// avoid missing-glyph rendering issues without embedding a custom font.
const inr = (n) => `Rs. ${Math.round(n || 0).toLocaleString('en-IN')}`;

const COMPANY = {
  name: 'Shashikant Lace',
  tagline: 'Fine Fabrics & Heritage Trimmings',
  address: 'No. 7, Heritage Lane, Mumbai, Maharashtra 400001, India',
  email: 'shashikantlace@gmail.com',
  gstin: process.env.COMPANY_GSTIN || '',
};

// The invoice header/footer bands are dark navy, so prefer the white
// logo variant (same one used in the CID-embedded email header) so it
// doesn't blend into the background. Falls back to the standard logo
// only if the white version isn't available.
const resolveLogoPath = () => {
  const candidates = [
    path.join(process.cwd(), 'assets', 'logo_white.png'),
    path.join(process.cwd(), 'assets', 'logo.png'),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
};

let cachedCroppedLogo = null;

/**
 * The source logo PNG has a large transparent margin around the actual
 * crest artwork (~28% empty on left/right, ~10% top/bottom). Embedding
 * it as-is at a fixed height wastes most of the box on empty space,
 * making the crest render small and soft. This crops tightly to the
 * visible (non-transparent) pixels so the full render height is used
 * by the actual artwork, and caches the result for reuse across calls.
 */
function getCroppedLogo() {
  if (cachedCroppedLogo !== undefined && cachedCroppedLogo !== null) return cachedCroppedLogo;

  const logoPath = resolveLogoPath();
  if (!logoPath) {
    cachedCroppedLogo = null;
    return null;
  }

  try {
    const png = PNG.sync.read(fs.readFileSync(logoPath));
    const { width, height, data } = png;

    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (data[idx + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) {
      cachedCroppedLogo = null;
      return null;
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    const cropped = new PNG({ width: cropWidth, height: cropHeight });
    PNG.bitblt(png, cropped, minX, minY, cropWidth, cropHeight, 0, 0);

    cachedCroppedLogo = {
      buffer: PNG.sync.write(cropped),
      aspect: cropWidth / cropHeight,
    };
  } catch {
    cachedCroppedLogo = null;
  }

  return cachedCroppedLogo;
}

/**
 * Generates a professional invoice PDF for an order and resolves with a Buffer.
 * @param {object} order - Mongoose Order document (or plain object with the same shape)
 * @returns {Promise<Buffer>}
 */
export function generateInvoiceBuffer(order) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const marginX = 50;
      const contentWidth = pageWidth - marginX * 2;

      const customer = order.customer || {};
      const customerName = order.customer_name || customer.fullName || 'Valued Customer';
      const customerEmail = order.customer_email || customer.email || '';
      const items = order.items || [];
      const createdDate = order.created_date ? new Date(order.created_date) : new Date();
      const isPaidOnline = order.payment_status === 'paid';

      // ── Header band ─────────────────────────────────────────────
      // Logo, company wordmark, and the INVOICE/number block are all
      // vertically centered on the same horizontal line within the
      // header band, left/right-anchored to the page margins.
      const headerHeight = 118;
      doc.rect(0, 0, pageWidth, headerHeight).fill(NAVY);
      const headerCenterY = headerHeight / 2;

      const croppedLogo = getCroppedLogo();
      const logoHeight = 62;
      const logoTop = headerCenterY - logoHeight / 2;
      let textStartX = marginX;
      if (croppedLogo) {
        try {
          const logoWidth = logoHeight * croppedLogo.aspect;
          doc.image(croppedLogo.buffer, marginX, logoTop, { height: logoHeight, width: logoWidth });
          textStartX = marginX + logoWidth + 18;
        } catch {
          // fall back to text-only header if image embedding fails
        }
      }

      // Company name + tagline, centered as a block on the same
      // horizontal midline as the logo.
      const nameFontSize = 20;
      const taglineFontSize = 8.5;
      const nameTaglineGap = 5;
      const wordmarkBlockHeight = nameFontSize + nameTaglineGap + taglineFontSize;
      const wordmarkY = headerCenterY - wordmarkBlockHeight / 2;
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(nameFontSize)
        .text(COMPANY.name, textStartX, wordmarkY, { width: contentWidth * 0.5 });
      doc.fillColor(SLATE_LIGHT).font('Helvetica').fontSize(taglineFontSize)
        .text(COMPANY.tagline.toUpperCase(), textStartX, wordmarkY + nameFontSize + nameTaglineGap, { characterSpacing: 1.5 });

      // INVOICE + order number, centered as a block on the same
      // horizontal midline, right-anchored to the page margin.
      const invoiceFontSize = 24;
      const invoiceNumFontSize = 9;
      const invoiceGap = 6;
      const invoiceBlockHeight = invoiceFontSize * 0.78 + invoiceGap + invoiceNumFontSize;
      const invoiceY = headerCenterY - invoiceBlockHeight / 2;
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(invoiceFontSize)
        .text('INVOICE', 0, invoiceY, { width: pageWidth - marginX, align: 'right' });
      doc.fillColor('#CBD5E1').font('Helvetica').fontSize(invoiceNumFontSize)
        .text(`#${order.order_number}`, 0, invoiceY + invoiceFontSize * 0.78 + invoiceGap, { width: pageWidth - marginX, align: 'right' });

      let y = headerHeight + 30;

      // ── Meta row: Billed To / Invoice details ──────────────────
      const colWidth = contentWidth / 2 - 10;

      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
        .text('BILLED TO', marginX, y, { characterSpacing: 1 });
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
        .text(customerName, marginX, y + 16);
      doc.fillColor(SLATE).font('Helvetica').fontSize(9);
      let billY = y + 34;
      if (customerEmail) { doc.text(customerEmail, marginX, billY); billY += 14; }
      if (customer.phone) { doc.text(customer.phone, marginX, billY); billY += 14; }
      const addressParts = [customer.address, customer.city, customer.state, customer.pincode].filter(Boolean);
      if (addressParts.length) {
        doc.text(addressParts.join(', '), marginX, billY, { width: colWidth });
      }

      const rightColX = marginX + colWidth + 20;
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
        .text('INVOICE DETAILS', rightColX, y, { characterSpacing: 1 });

      const metaRows = [
        ['Invoice No.', `#${order.order_number}`],
        ['Order Date', createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
        ['Payment Method', order.payment_method || (order.payment_method_type === 'cod' ? 'Cash on Delivery' : 'Online')],
        ['Payment Status', isPaidOnline ? 'Paid' : (order.payment_method_type === 'cod' ? 'Cash on Delivery' : 'Pending')],
      ];
      if (order.razorpay_payment_id) {
        metaRows.push(['Transaction ID', order.razorpay_payment_id]);
      }
      if (COMPANY.gstin) {
        metaRows.push(['Seller GSTIN', COMPANY.gstin]);
      }

      let metaY = y + 16;
      metaRows.forEach(([label, value]) => {
        doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(`${label}:`, rightColX, metaY, { continued: true, width: colWidth });
        doc.fillColor(NAVY).font('Helvetica-Bold').text(`  ${value}`, { width: colWidth });
        metaY += 15;
      });

      y = Math.max(billY + 20, metaY + 10);

      // ── Items table ──────────────────────────────────────────────
      const tableTop = y + 10;
      const col = {
        item: marginX,
        qty: marginX + contentWidth * 0.52,
        rate: marginX + contentWidth * 0.68,
        amount: marginX + contentWidth * 0.84,
      };
      const rowHeight = 26;

      doc.rect(marginX, tableTop, contentWidth, 28).fill(NAVY);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      doc.text('ITEM DESCRIPTION', col.item + 12, tableTop + 9);
      doc.text('QTY (YD)', col.qty, tableTop + 9, { width: col.rate - col.qty - 8, align: 'right' });
      doc.text('RATE', col.rate, tableTop + 9, { width: col.amount - col.rate - 8, align: 'right' });
      doc.text('AMOUNT', col.amount, tableTop + 9, { width: marginX + contentWidth - col.amount - 12, align: 'right' });

      let rowY = tableTop + 28;
      items.forEach((item, idx) => {
        const qty = item.quantity || item.qty || 1;
        const price = item.price || 0;
        const lineTotal = qty * price;
        const bg = idx % 2 === 0 ? '#FFFFFF' : BG_LIGHT;

        doc.rect(marginX, rowY, contentWidth, rowHeight).fill(bg);
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9.5)
          .text(item.name || 'Item', col.item + 12, rowY + 6, { width: col.qty - col.item - 20 });
        if (item.color) {
          doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
            .text(item.color, col.item + 12, rowY + 17, { width: col.qty - col.item - 20 });
        }
        doc.fillColor(SLATE).font('Helvetica').fontSize(9.5)
          .text(String(qty), col.qty, rowY + 8, { width: col.rate - col.qty - 8, align: 'right' });
        doc.text(inr(price), col.rate, rowY + 8, { width: col.amount - col.rate - 8, align: 'right' });
        doc.fillColor(NAVY).font('Helvetica-Bold')
          .text(inr(lineTotal), col.amount, rowY + 8, { width: marginX + contentWidth - col.amount - 12, align: 'right' });

        rowY += rowHeight;
      });

      doc.rect(marginX, tableTop, contentWidth, rowY - tableTop).strokeColor(BORDER).lineWidth(1).stroke();

      // ── Totals ───────────────────────────────────────────────────
      let totalsY = rowY + 20;
      const totalsBoxX = marginX + contentWidth * 0.55;
      const totalsBoxWidth = contentWidth * 0.45;

      const totalLines = [
        ['Subtotal', inr(order.subtotal), SLATE],
      ];
      if (order.discount) totalLines.push(['Discount' + (order.applied_coupon ? ` (${order.applied_coupon})` : ''), `- ${inr(order.discount)}`, GREEN]);
      totalLines.push(['Shipping', order.shipping ? inr(order.shipping) : 'Free', SLATE]);
      totalLines.push(['GST (5%)', inr(order.tax), SLATE]);

      totalLines.forEach(([label, value, color]) => {
        doc.fillColor(color).font('Helvetica').fontSize(9.5)
          .text(label, totalsBoxX, totalsY, { width: totalsBoxWidth * 0.55 });
        doc.text(value, totalsBoxX + totalsBoxWidth * 0.55, totalsY, { width: totalsBoxWidth * 0.45, align: 'right' });
        totalsY += 17;
      });

      doc.moveTo(totalsBoxX, totalsY + 3).lineTo(totalsBoxX + totalsBoxWidth, totalsY + 3).strokeColor(BORDER).lineWidth(1).stroke();
      totalsY += 12;

      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13)
        .text('Total Amount', totalsBoxX, totalsY, { width: totalsBoxWidth * 0.55 });
      doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(13)
        .text(inr(order.total), totalsBoxX + totalsBoxWidth * 0.55, totalsY, { width: totalsBoxWidth * 0.45, align: 'right' });

      totalsY += 30;

      // ── Shipping address block ─────────────────────────────────
      if (addressParts.length) {
        doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9)
          .text('SHIP TO', marginX, totalsY, { characterSpacing: 1 });
        doc.fillColor(SLATE).font('Helvetica').fontSize(9.5)
          .text(addressParts.join(', '), marginX, totalsY + 14, { width: contentWidth * 0.5 });
      }

      // ── Footer ───────────────────────────────────────────────────
      const footerY = doc.page.height - 110;
      doc.rect(0, footerY, pageWidth, 110).fill(NAVY);
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(11)
        .text(COMPANY.name.toUpperCase(), 0, footerY + 24, { width: pageWidth, align: 'center', characterSpacing: 1 });
      doc.fillColor(SLATE_LIGHT).font('Helvetica').fontSize(8.5)
        .text(COMPANY.address, 0, footerY + 42, { width: pageWidth, align: 'center' });
      doc.text(`${COMPANY.email}${COMPANY.gstin ? `  |  GSTIN: ${COMPANY.gstin}` : ''}`, 0, footerY + 56, { width: pageWidth, align: 'center' });
      doc.fillColor(MUTED).font('Helvetica').fontSize(8)
        .text('This is a computer-generated invoice and does not require a physical signature.', 0, footerY + 76, { width: pageWidth, align: 'center' });
      doc.text(`(c) ${new Date().getFullYear()} Shashikant Lace. All rights reserved.`, 0, footerY + 90, { width: pageWidth, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
