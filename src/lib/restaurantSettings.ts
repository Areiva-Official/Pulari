// ─────────────────────────────────────────────────────────────────────────────
// RESTAURANT SETTINGS — shared defaults + display helpers.
// These defaults are the single source of truth used as a fallback whenever the
// live settings API is unavailable, so the public site always renders correctly.
// ─────────────────────────────────────────────────────────────────────────────
import type { OpeningHours, RestaurantSettings } from '../types';

export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: 'Pulari Restaurant',
  tagline: "Dublin's Finest South Indian Cuisine",
  address: {
    line1: 'The Design House, Crow St',
    city: 'Temple Bar, Dublin',
    county: 'Dublin',
    postcode: 'D02 F884',
    country: 'Ireland',
  },
  phone: '083 068 1518',
  email: 'pularidesicafe@gmail.com',
  whatsapp: '353830681518',
  website: 'https://www.pulari.ie',
  openingHours: [
    { dayOfWeek: 0, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 1, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '12:00', closeTime: '21:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '12:00', closeTime: '22:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '12:00', closeTime: '22:00' },
  ],
  socialLinks: {},
  stripePublishableKey: '',
  enableOnlineOrdering: true,
  enableReservations: true,
  enableDelivery: false,
  serviceChargePercent: 0,
  taxPercent: 0,
};

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// '12:00' → '12 PM', '21:00' → '9 PM', '09:30' → '9:30 AM'
export function formatTime12(hhmm?: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr ?? '0', 10);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h} ${ampm}` : `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export interface HoursLine {
  days: string;
  time: string;
  isOpen: boolean;
}

// Groups consecutive days (Sun→Sat) that share the same hours into compact
// ranges, e.g. "Sun – Thu: 12 PM – 9 PM" and "Fri – Sat: 12 PM – 10 PM".
export function formatHoursLines(hours: OpeningHours[]): HoursLine[] {
  if (!hours || hours.length === 0) return [];
  const byDay = [...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  type Group = { key: string; start: number; end: number; isOpen: boolean; open?: string; close?: string };
  const groups: Group[] = [];

  for (const h of byDay) {
    const key = h.isOpen ? `${h.openTime}-${h.closeTime}` : 'closed';
    const last = groups[groups.length - 1];
    if (last && last.key === key && last.end === h.dayOfWeek - 1) {
      last.end = h.dayOfWeek;
    } else {
      groups.push({ key, start: h.dayOfWeek, end: h.dayOfWeek, isOpen: h.isOpen, open: h.openTime, close: h.closeTime });
    }
  }

  return groups.map((g) => ({
    days: g.start === g.end ? DAY_ABBR[g.start] : `${DAY_ABBR[g.start]} – ${DAY_ABBR[g.end]}`,
    time: g.isOpen ? `${formatTime12(g.open)} – ${formatTime12(g.close)}` : 'Closed',
    isOpen: g.isOpen,
  }));
}

// Builds a tel: href from the digits-only whatsapp number, falling back to phone.
export function telHref(settings: Pick<RestaurantSettings, 'whatsapp' | 'phone'>): string {
  const digits = (settings.whatsapp || settings.phone || '').replace(/[^\d]/g, '');
  return digits ? `tel:+${digits}` : 'tel:';
}
