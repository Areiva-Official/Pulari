// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS HANDLER
//   POST  /payments/intent               (public — create/refresh PaymentIntent)
//   POST  /payments/{id}/confirm         (public — sync order from PI status)
//   POST  /admin/payments/{id}/refund    (admin — refund a PaymentIntent)
//
// SECURITY: the charge amount is ALWAYS derived from order.total in DynamoDB,
// which itself was computed server-side from the menu. The client cannot
// influence the amount. Existing intents are reused (and re-priced if the order
// changed) so a customer is never charged twice for one order.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  createPaymentIntentSchema,
  parseBody,
  refundSchema,
} from '../shared/schemas.js';
import {
  getStripe,
  stripeConfigured,
} from '../shared/stripe.js';
import { PaymentsNotConfigured } from '../shared/stripe.js';
import {
  attachPaymentIntent,
  getOrder,
  markOrderPaid,
  markOrderRefunded,
} from '../shared/orders.js';
import { requireAdmin } from '../shared/auth.js';
import { badRequest, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import { logAuditEvent } from '../shared/audit.js';

const REUSABLE_STATUSES = new Set([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
]);

const toCents = (eur: number): number => Math.round(eur * 100);

function ensureConfigured() {
  if (!stripeConfigured()) {
    throw new PaymentsNotConfigured();
  }
}

async function createIntent(event: APIGatewayProxyEventV2, origin?: string) {
  ensureConfigured();
  const { orderId, customerEmail } = parseBody(
    createPaymentIntentSchema,
    event.body
  );

  const order = await getOrder(orderId);
  if (!order) return notFound('Order not found', origin);
  if (order.paymentStatus === 'succeeded') {
    return badRequest('This order has already been paid', origin);
  }

  const amount = toCents(order.total);
  if (amount < 50) {
    return badRequest('Order total is below the minimum payable amount', origin);
  }

  const stripe = getStripe();

  // Reuse an existing intent when possible — prevents duplicate charges and
  // keeps a single PaymentIntent per order across page refreshes.
  if (order.paymentIntentId) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.paymentIntentId);
      if (REUSABLE_STATUSES.has(existing.status)) {
        const synced =
          existing.amount === amount
            ? existing
            : await stripe.paymentIntents.update(existing.id, { amount });
        return ok(
          {
            id: synced.id,
            orderId: order.id,
            amount: synced.amount,
            currency: synced.currency,
            status: synced.status,
            clientSecret: synced.client_secret,
          },
          origin
        );
      }
    } catch {
      // Intent missing/unusable — fall through and create a fresh one.
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    description: `Pulari order ${order.orderNumber}`,
    receipt_email: customerEmail || order.customerEmail,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
    },
    automatic_payment_methods: { enabled: true },
  });

  await attachPaymentIntent(order.id, intent.id);

  void logAuditEvent({
    eventType: 'payment.intent_created',
    actorLabel: customerEmail || order.customerEmail,
    resourceId: order.id,
    data: {
      orderNumber: order.orderNumber,
      paymentIntentId: intent.id,
      amountEur: order.total,
    },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  return ok(
    {
      id: intent.id,
      orderId: order.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret,
    },
    origin
  );
}

// Server-side reconciliation fallback (the webhook is the primary path).
async function confirmPayment(event: APIGatewayProxyEventV2, origin?: string) {
  ensureConfigured();
  const paymentIntentId = event.pathParameters?.id;
  if (!paymentIntentId) throw new NotFoundError('PaymentIntent id required');

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const orderId = pi.metadata?.orderId;

  if (pi.status === 'succeeded' && orderId) {
    await markOrderPaid(orderId, pi.id);
  }

  return ok(
    {
      id: pi.id,
      orderId: orderId ?? null,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
    },
    origin
  );
}

async function refundPayment(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  ensureConfigured();
  const paymentIntentId = event.pathParameters?.id;
  if (!paymentIntentId) throw new NotFoundError('PaymentIntent id required');
  const { amount, reason } = parseBody(refundSchema, event.body);

  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? toCents(amount) : undefined, // full refund when omitted
    reason: 'requested_by_customer',
    metadata: { note: reason ?? '' },
  });

  const orderId = pi.metadata?.orderId;
  if (orderId) {
    const fullyRefunded = (refund.amount ?? 0) >= pi.amount;
    await markOrderRefunded(orderId, fullyRefunded);
  }

  void logAuditEvent({
    eventType: 'payment.refunded',
    actorLabel: 'admin',
    resourceId: orderId ?? paymentIntentId,
    data: {
      paymentIntentId,
      refundId: refund.id,
      amountCents: refund.amount,
      reason: reason ?? 'requested_by_customer',
    },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  return ok(
    { id: refund.id, status: refund.status, amount: refund.amount },
    origin
  );
}

export const handler = createRouter({
  'POST /payments/intent': createIntent,
  'POST /payments/{id}/confirm': confirmPayment,
  'POST /admin/payments/{id}/refund': refundPayment,
});
