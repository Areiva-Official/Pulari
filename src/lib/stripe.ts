// ─────────────────────────────────────────────────────────────────────────────
// STRIPE CLIENT — Pulari Restaurant
// Loads the Stripe.js SDK lazily. The publishable key is read at runtime from
// restaurant settings (DynamoDB) so it can be changed in the admin panel without
// rebuilding; it falls back to VITE_STRIPE_PUBLISHABLE_KEY. Never the secret key.
// ─────────────────────────────────────────────────────────────────────────────

const ENV_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? '';

let cachedKey: string | null = null;
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;

function resolveKey(settingsKey?: string): string {
  return (settingsKey && settingsKey.trim()) || ENV_KEY;
}

/**
 * Returns a memoised Stripe instance. Pass the publishable key from settings;
 * falls back to the build-time env var. Resolves to null when no key is set.
 */
export function getStripe(settingsKey?: string) {
  const key = resolveKey(settingsKey);
  if (!key) {
    console.warn('[Stripe] No publishable key (settings or VITE_STRIPE_PUBLISHABLE_KEY) — payment UI will not load.');
    return Promise.resolve(null);
  }
  if (stripePromise && cachedKey === key) return stripePromise;
  cachedKey = key;
  stripePromise = import('@stripe/stripe-js').then(({ loadStripe }) => loadStripe(key));
  return stripePromise;
}

export const hasStripeKey = (settingsKey?: string): boolean => Boolean(resolveKey(settingsKey));

// Currency helper: Stripe requires amounts in smallest currency unit (cents)
export const toCents = (euros: number): number => Math.round(euros * 100);
export const fromCents = (cents: number): number => cents / 100;

// Format euros for display
export const formatEuro = (amount: number): string =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
