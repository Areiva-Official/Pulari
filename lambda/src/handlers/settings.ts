// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS HANDLER
//   GET /settings            (public — safe subset)
//   PUT /admin/settings      (admin)
// Settings are stored as a single DynamoDB item with key = 'restaurant'.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { requireAdmin } from '../shared/auth.js';
import { parseBody, settingsUpdateSchema } from '../shared/schemas.js';
import { ok } from '../shared/response.js';
import { createRouter } from '../shared/router.js';

const SETTINGS_KEY = 'restaurant';

const DEFAULT_SETTINGS = {
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

async function getSettings(_event: APIGatewayProxyEventV2, origin?: string) {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { key: SETTINGS_KEY } })
  );
  const value = (res.Item?.value as Record<string, unknown>) ?? DEFAULT_SETTINGS;
  return ok(value, origin);
}

async function updateSettings(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const updates = parseBody(settingsUpdateSchema, event.body);

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { key: SETTINGS_KEY } })
  );
  const current = (existing.Item?.value as Record<string, unknown>) ?? DEFAULT_SETTINGS;
  const merged = { ...current, ...updates };

  await ddb.send(
    new PutCommand({
      TableName: TABLES.settings,
      Item: { key: SETTINGS_KEY, value: merged, updatedAt: new Date().toISOString() },
    })
  );
  return ok(merged, origin);
}

export const handler = createRouter({
  'GET /settings': getSettings,
  'PUT /admin/settings': updateSettings,
});
