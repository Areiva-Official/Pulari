// ─────────────────────────────────────────────────────────────────────────────
// EMAIL — AWS SES v2 transactional email helper.
//
// All exported send functions are FIRE-AND-FORGET: they never throw.
// Failures are logged to CloudWatch Logs only, so email issues never block
// a customer-facing order or reservation response.
//
// Emails are silently skipped when SES_FROM_ADDRESS is not set, which lets
// local dev and staging work without SES credentials.
// ─────────────────────────────────────────────────────────────────────────────
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { Order, Reservation } from './types.js';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';
const FROM = process.env.SES_FROM_ADDRESS ?? '';
const RESTAURANT_EMAIL = process.env.RESTAURANT_EMAIL ?? 'pularidesicafe@gmail.com';

/** Emails are skipped when SES_FROM_ADDRESS env var is not set */
const enabled = (): boolean => FROM.length > 0;

const ses = new SESv2Client({ region: REGION });

// ─── LOW-LEVEL SEND ───────────────────────────────────────────────────────────

async function send(
  to: string | string[],
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  if (!enabled()) return;
  const toAddresses = Array.isArray(to) ? to : [to];
  try {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: `Pulari Restaurant <${FROM}>`,
        Destination: { ToAddresses: toAddresses },
        Content: {
          Simple: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        },
      }),
    );
  } catch (err) {
    console.error('[email] send failed', {
      to: toAddresses.join(', '),
      subject,
      error: (err as Error).message,
    });
  }
}

// ─── HTML TEMPLATE HELPERS ────────────────────────────────────────────────────

function wrap(preheader: string, body: string): string {
  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Pulari Restaurant</title></head>' +
    '<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="display:none;max-height:0;overflow:hidden;color:#f9fafb;">' +
    preheader +
    '</div>' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;' +
    'background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">' +
    // Header
    '<tr><td style="background:linear-gradient(135deg,#d97706 0%,#b45309 100%);padding:32px 40px;">' +
    '<h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Pulari Restaurant</h1>' +
    '<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Authentic Kerala Cuisine · Temple Street, Dublin 2</p>' +
    '</td></tr>' +
    // Body
    '<tr><td style="padding:36px 40px;">' + body + '</td></tr>' +
    // Footer
    '<tr><td style="padding:20px 40px;border-top:1px solid #f3f4f6;background:#fafafa;">' +
    '<p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.8;">' +
    '📍 Temple Street, Dublin 2, Ireland<br>' +
    '📞 083 068 1518 &nbsp;·&nbsp; ✉️ pularidesicafe@gmail.com<br>' +
    '🕐 Mon, Wed–Sun: 12:00 PM – 9:00 PM' +
    '</p></td></tr>' +
    '</table></td></tr></table></body></html>'
  );
}

const h2 = (text: string) =>
  `<h2 style="margin:0 0 10px;color:#1f2937;font-size:20px;font-weight:700;">${text}</h2>`;

const p = (text: string, muted = false) =>
  `<p style="margin:0 0 14px;color:${muted ? '#6b7280' : '#374151'};font-size:15px;line-height:1.65;">${text}</p>`;

const badge = (text: string, color = '#fef3c7', fg = '#92400e') =>
  `<span style="display:inline-block;background:${color};color:${fg};font-size:12px;font-weight:700;` +
  `padding:4px 14px;border-radius:20px;letter-spacing:0.4px;margin-bottom:16px;">${text}</span>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;">`;

const box = (content: string, bg = '#fef3c7', fg = '#92400e') =>
  `<div style="background:${bg};border-radius:10px;padding:16px 20px;margin-top:16px;">` +
  `<p style="margin:0;color:${fg};font-size:14px;line-height:1.7;">${content}</p></div>`;

const cta = (label: string, href: string) =>
  `<div style="margin-top:24px;">` +
  `<a href="${href}" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;` +
  `font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;">${label}</a></div>`;

function itemsTable(items: Order['items']): string {
  const rows = items
    .map(
      (i) =>
        `<tr>` +
        `<td style="padding:9px 0;color:#374151;font-size:14px;border-bottom:1px solid #f9fafb;">${i.quantity}× ${i.name}</td>` +
        `<td style="padding:9px 0;color:#1f2937;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #f9fafb;">€${i.subtotal.toFixed(2)}</td>` +
        `</tr>`,
    )
    .join('');
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 0;">` +
    `<tbody>${rows}</tbody></table>`
  );
}

function totals(order: Order): string {
  const lines: string[] = [];
  const row = (label: string, value: string, bold = false) =>
    `<div style="display:flex;justify-content:space-between;padding:5px 0;">` +
    `<span style="font-size:14px;color:#6b7280;">${label}</span>` +
    `<span style="font-size:${bold ? '17' : '14'}px;color:${bold ? '#d97706' : '#374151'};font-weight:${bold ? '700' : '500'};">${value}</span>` +
    `</div>`;
  if (order.discountAmount > 0)
    lines.push(row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `−€${order.discountAmount.toFixed(2)}`));
  lines.push(row('Total', `€${order.total.toFixed(2)}`, true));
  return `<div style="border-top:1px solid #f3f4f6;margin-top:12px;padding-top:12px;">${lines.join('')}</div>`;
}

function detailTable(rows: [string, string][]): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">` +
    rows
      .map(
        ([label, value]) =>
          `<tr>` +
          `<td style="padding:7px 12px 7px 0;color:#6b7280;font-size:14px;white-space:nowrap;">${label}</td>` +
          `<td style="padding:7px 0;color:#1f2937;font-size:14px;font-weight:600;">${value}</td>` +
          `</tr>`,
      )
      .join('') +
    `</table>`
  );
}

// ─── CUSTOMER: ORDER RECEIVED ─────────────────────────────────────────────────
/**
 * Sent immediately when an order is created (payment still pending).
 */
export async function sendOrderReceived(order: Order): Promise<void> {
  const firstName = order.customerName.split(' ')[0] ?? order.customerName;
  const subject = `Order received — ${order.orderNumber} · Pulari Restaurant`;
  const preheader = `Your order ${order.orderNumber} is placed. Total: €${order.total.toFixed(2)}.`;

  const html = wrap(
    preheader,
    h2(`Hi ${firstName}! We've got your order.`) +
      p(
        `Your order <strong style="color:#d97706;">${order.orderNumber}</strong> has been placed successfully. ` +
          `Once payment is confirmed, we'll start preparing your ${order.type === 'collection' ? 'collection order' : 'order'}.`,
      ) +
      badge('Order Placed') +
      divider() +
      h2('Your items') +
      itemsTable(order.items) +
      totals(order) +
      divider() +
      box(
        `📍 <strong>Collection address:</strong> Temple Street, Dublin 2<br>` +
          `📞 <strong>Questions?</strong> Call us on 087 973 8186`,
      ) +
      cta('View Full Menu', 'https://www.pulari.ie/menu'),
  );

  const text =
    `Hi ${firstName},\n\nYour order ${order.orderNumber} has been placed.\n\n` +
    order.items.map((i) => `${i.quantity}× ${i.name} — €${i.subtotal.toFixed(2)}`).join('\n') +
    `\n\nTotal: €${order.total.toFixed(2)}\n\nCollection: Temple Street, Dublin 2\n` +
    `Phone: 087 973 8186\n\nThank you,\nPulari Restaurant`;

  await send(order.customerEmail, subject, html, text);
}

// ─── CUSTOMER: PAYMENT CONFIRMED ─────────────────────────────────────────────
/**
 * Sent by the webhook when payment_intent.succeeded fires — the kitchen is
 * actively preparing the order at this point.
 */
export async function sendPaymentConfirmed(order: Order): Promise<void> {
  const firstName = order.customerName.split(' ')[0] ?? order.customerName;
  const subject = `Payment confirmed — ${order.orderNumber} · Pulari Restaurant`;
  const preheader = `Payment received! Your order is being prepared.`;

  const html = wrap(
    preheader,
    h2('Payment received! Your order is being prepared. 🍛') +
      p(
        `Hi ${firstName}, your payment for order <strong style="color:#d97706;">${order.orderNumber}</strong> ` +
          `was successful. Our kitchen is now preparing your food — we'll have it ready for collection shortly!`,
      ) +
      badge('Payment Confirmed ✓', '#d1fae5', '#065f46') +
      divider() +
      h2('Order summary') +
      itemsTable(order.items) +
      totals(order) +
      divider() +
      box(
        `📍 <strong>Collect from:</strong> Temple Street, Dublin 2<br>` +
          `📞 <strong>Questions?</strong> Call us on 087 973 8186`,
        '#ecfdf5',
        '#065f46',
      ) +
      cta('View Full Menu', 'https://www.pulari.ie/menu'),
  );

  const text =
    `Hi ${firstName},\n\nPayment confirmed for order ${order.orderNumber}. Total: €${order.total.toFixed(2)}.\n\n` +
    `Your food is being prepared!\n\nCollect from: Temple Street, Dublin 2\nPhone: 087 973 8186\n\nPulari Restaurant`;

  await send(order.customerEmail, subject, html, text);
}

// ─── CUSTOMER: RESERVATION CONFIRMED ─────────────────────────────────────────
/**
 * Sent immediately when a reservation is created.
 */
export async function sendReservationConfirmed(reservation: Reservation): Promise<void> {
  const firstName = reservation.customerName.split(' ')[0] ?? reservation.customerName;
  const dateStr = new Date(reservation.date).toLocaleDateString('en-IE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const subject = `Reservation confirmed — Pulari Restaurant, ${dateStr}`;
  const preheader = `Table for ${reservation.guests} on ${dateStr} at ${reservation.time}.`;

  const rows: [string, string][] = [
    ['📅 Date', dateStr],
    ['🕐 Time', reservation.time],
    ['👥 Guests', String(reservation.guests)],
  ];
  if (reservation.notes) rows.push(['📝 Notes', reservation.notes]);

  const html = wrap(
    preheader,
    h2(`Your table is reserved! 🎉`) +
      p(
        `Hi ${firstName}, we're delighted to confirm your reservation at Pulari Restaurant. ` +
          `We look forward to welcoming you!`,
      ) +
      badge('Reservation Confirmed') +
      divider() +
      detailTable(rows) +
      divider() +
      box(
        `📍 <strong>Address:</strong> Temple Street, Dublin 2<br>` +
          `📞 <strong>Phone:</strong> 087 973 8186<br>` +
          `To change or cancel, please call us directly.`,
      ) +
      cta('Browse Menu', 'https://www.pulari.ie/menu'),
  );

  const text =
    `Hi ${firstName},\n\nYour reservation at Pulari Restaurant is confirmed!\n\n` +
    `Date: ${dateStr}\nTime: ${reservation.time}\nGuests: ${reservation.guests}\n` +
    (reservation.notes ? `Notes: ${reservation.notes}\n` : '') +
    `\nAddress: Temple Street, Dublin 2\nPhone: 087 973 8186\n\nPulari Restaurant`;

  await send(reservation.customerEmail, subject, html, text);
}

// ─── RESTAURANT: NEW ORDER NOTIFICATION ──────────────────────────────────────
/**
 * Sent to the restaurant whenever a customer places an order.
 */
export async function notifyNewOrder(order: Order): Promise<void> {
  const subject = `🆕 New ${order.type.replace('_', ' ')} order — ${order.orderNumber} (€${order.total.toFixed(2)})`;
  const preheader = `${order.customerName} · €${order.total.toFixed(2)}`;

  const html = wrap(
    preheader,
    h2(`New ${order.type.replace('_', ' ')} order`) +
      badge(order.orderNumber) +
      divider() +
      detailTable([
        ['Customer', order.customerName],
        ['Email', order.customerEmail],
        ['Phone', order.customerPhone],
        ['Type', order.type.replace('_', ' ')],
      ]) +
      divider() +
      h2('Items') +
      itemsTable(order.items) +
      totals(order),
  );

  const text =
    `New order: ${order.orderNumber}\nCustomer: ${order.customerName} · ${order.customerPhone}\n` +
    order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ') +
    `\nTotal: €${order.total.toFixed(2)}\nType: ${order.type}`;

  await send(RESTAURANT_EMAIL, subject, html, text);
}

// ─── RESTAURANT: NEW RESERVATION NOTIFICATION ────────────────────────────────
/**
 * Sent to the restaurant whenever a customer makes a reservation.
 */
export async function notifyNewReservation(reservation: Reservation): Promise<void> {
  const dateStr = new Date(reservation.date).toLocaleDateString('en-IE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const subject = `📅 New reservation — ${reservation.customerName}, ${reservation.guests} guests, ${dateStr} at ${reservation.time}`;
  const preheader = `${reservation.customerName} · ${reservation.guests} guests · ${dateStr} at ${reservation.time}`;

  const rows: [string, string][] = [
    ['Name', reservation.customerName],
    ['Email', reservation.customerEmail],
    ['Phone', reservation.customerPhone],
    ['Date', dateStr],
    ['Time', reservation.time],
    ['Guests', String(reservation.guests)],
  ];
  if (reservation.notes) rows.push(['Notes', reservation.notes]);

  const html = wrap(preheader, h2('New reservation') + badge(preheader) + divider() + detailTable(rows));

  const text =
    `New reservation: ${reservation.customerName}\n${reservation.guests} guests · ${dateStr} at ${reservation.time}\n` +
    `Phone: ${reservation.customerPhone}\nEmail: ${reservation.customerEmail}` +
    (reservation.notes ? `\nNotes: ${reservation.notes}` : '');

  await send(RESTAURANT_EMAIL, subject, html, text);
}
