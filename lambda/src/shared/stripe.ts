// ─────────────────────────────────────────────────────────────────────────────
// STRIPE CLIENT — single shared instance, created lazily from STRIPE_SECRET_KEY.
// If the key is absent, handlers respond 503 instead of crashing — so the site
// stays fully functional before payment keys are configured.
// ─────────────────────────────────────────────────────────────────────────────
import Stripe from 'stripe';

const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

export class PaymentsNotConfigured extends Error {
  readonly httpStatus = 503;
  constructor() {
    super('Payments are not configured');
    this.name = 'PaymentsNotConfigured';
  }
}

let instance: Stripe | null = null;

export function stripeConfigured(): boolean {
  return SECRET_KEY.length > 0;
}

export function webhookConfigured(): boolean {
  return SECRET_KEY.length > 0 && WEBHOOK_SECRET.length > 0;
}

export function getStripe(): Stripe {
  if (!SECRET_KEY) throw new PaymentsNotConfigured();
  if (!instance) {
    instance = new Stripe(SECRET_KEY, {
      // Pin the API version for deterministic behaviour across deploys.
      apiVersion: '2024-06-20',
      maxNetworkRetries: 2,
      timeout: 12_000,
    });
  }
  return instance;
}

export function getWebhookSecret(): string {
  return WEBHOOK_SECRET;
}
