// ─────────────────────────────────────────────────────────────────────────────
// PULARI ANALYTICS — AWS Pinpoint (via Amplify)
//
// Mock mode  (no VITE_PINPOINT_APP_ID): events logged to console + localStorage
// Production (VITE_PINPOINT_APP_ID set): events sent to Amazon Pinpoint
//
// Usage:
//   trackPageView('/menu')
//   trackEvent('add_to_cart', { item: 'Masala Dosa', price: 9.99 })
// ─────────────────────────────────────────────────────────────────────────────

const IS_PRODUCTION = !!import.meta.env.VITE_PINPOINT_APP_ID;
const LOCAL_KEY = 'pulari_analytics_events';
const MAX_LOCAL_EVENTS = 200;

interface AnalyticsEvent {
  name: string;
  attributes?: Record<string, string>;
  metrics?: Record<string, number>;
  timestamp: string;
}

function storeLocally(event: AnalyticsEvent) {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const events: AnalyticsEvent[] = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    events.push(event);
    // Keep only the last N events to avoid localStorage bloat
    const trimmed = events.slice(-MAX_LOCAL_EVENTS);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(trimmed));
  } catch { /* storage full or disabled — silently ignore */ }
}

async function sendToPinpoint(event: AnalyticsEvent) {
  try {
    const { record } = await import('aws-amplify/analytics');
    await record({
      name: event.name,
      attributes: event.attributes ?? {},
      metrics: event.metrics ?? {},
    });
  } catch {
    // Pinpoint not yet configured — log locally as fallback
    if (import.meta.env.DEV) {
      console.debug('[analytics] Pinpoint not configured, falling back to local', event.name);
    }
    storeLocally(event);
  }
}

function dispatch(name: string, attributes?: Record<string, string>, metrics?: Record<string, number>) {
  const event: AnalyticsEvent = {
    name,
    attributes,
    metrics,
    timestamp: new Date().toISOString(),
  };

  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, attributes ?? '', metrics ?? '');
  }

  if (IS_PRODUCTION) {
    void sendToPinpoint(event);
  } else {
    storeLocally(event);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function trackPageView(page: string) {
  dispatch('page_view', { page, referrer: document.referrer || 'direct' });
}

export function trackEvent(
  name: string,
  attributes?: Record<string, string>,
  metrics?: Record<string, number>,
) {
  dispatch(name, attributes, metrics);
}

export function trackAddToCart(itemName: string, price: number, category: string) {
  dispatch('add_to_cart', { item: itemName, category }, { price, quantity: 1 });
}

export function trackOrderPlaced(orderNumber: string, total: number, itemCount: number) {
  dispatch('order_placed', { order_number: orderNumber }, { total, item_count: itemCount });
}

export function trackReservationAttempt(guests: number) {
  dispatch('reservation_attempt', {}, { guests });
}

/** Returns locally-stored dev events for the admin analytics view */
export function getLocalEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}
