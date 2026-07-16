// ─────────────────────────────────────────────────────────────────────────────
// STRIPE WEBHOOK HANDLER  →  POST /webhooks/stripe   (public, signature-verified)
//
// This endpoint is PUBLIC (called by Stripe, not a logged-in user). Its security
// control is the Stripe signature: the raw request body is verified against
// STRIPE_WEBHOOK_SECRET before any action is taken. Fulfilment is idempotent, so
// Stripe's automatic retries can never double-process an order.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import type Stripe from 'stripe';
import { getStripe, getWebhookSecret, webhookConfigured } from '../shared/stripe.js';
import {
  getOrder,
  markOrderFailed,
  markOrderPaid,
  markOrderRefunded,
} from '../shared/orders.js';
import { sendPaymentConfirmed } from '../shared/email.js';

const text = (
  statusCode: number,
  body: string
): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body,
});

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent): Promise<void> {
  const orderId = pi.metadata?.orderId;
  if (!orderId) {
    console.warn(`payment_intent.succeeded ${pi.id} has no orderId metadata`);
    return;
  }
  const applied = await markOrderPaid(orderId, pi.id);
  console.log(
    `payment_intent.succeeded order=${orderId} ${applied ? 'marked paid' : 'already paid (idempotent no-op)'}`
  );
  // Send payment confirmation email only on first successful transition.
  if (applied) {
    const order = await getOrder(orderId);
    if (order) void sendPaymentConfirmed(order);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent): Promise<void> {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;
  await markOrderFailed(orderId);
  console.log(`payment_intent.payment_failed order=${orderId} marked failed`);
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const piId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;

  let orderId = charge.metadata?.orderId;
  if (!orderId) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(piId);
      orderId = pi.metadata?.orderId;
    } catch {
      /* ignore */
    }
  }
  if (!orderId) return;

  const fullyRefunded = (charge.amount_refunded ?? 0) >= charge.amount;
  await markOrderRefunded(orderId, fullyRefunded);
  console.log(
    `charge.refunded order=${orderId} ${fullyRefunded ? 'fully' : 'partially'} refunded`
  );
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!webhookConfigured()) {
    return text(503, JSON.stringify({ message: 'Webhook not configured' }));
  }

  const signature =
    event.headers?.['stripe-signature'] ?? event.headers?.['Stripe-Signature'];
  if (!signature) {
    return text(400, JSON.stringify({ message: 'Missing stripe-signature' }));
  }

  // Stripe requires the EXACT raw bytes — never JSON.parse before verifying.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64')
    : (event.body ?? '');

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      getWebhookSecret()
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return text(400, JSON.stringify({ message: 'Invalid signature' }));
  }

  try {
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(stripeEvent.data.object as Stripe.Charge);
        break;
      default:
        // Acknowledge unhandled events so Stripe stops retrying them.
        console.log(`Unhandled Stripe event: ${stripeEvent.type}`);
    }
  } catch (err) {
    // A 500 makes Stripe retry later — appropriate for transient DB errors.
    console.error(`Error handling ${stripeEvent.type}:`, err);
    return text(500, JSON.stringify({ message: 'Processing error' }));
  }

  return text(200, JSON.stringify({ received: true }));
};
