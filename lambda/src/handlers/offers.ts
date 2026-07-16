// ─────────────────────────────────────────────────────────────────────────────
// OFFERS HANDLER
//   GET  /offers              (public — active only)
//   GET  /admin/offers        (admin — all)
//   POST /admin/offers        (admin)
//   PUT  /admin/offers/{id}   (admin)
//   DELETE /admin/offers/{id} (admin)
// Offers are low-volume marketing content stored as an array in the settings
// table under key = 'offers' (avoids a dedicated table).
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { requireAdmin } from '../shared/auth.js';
import { newId, nowIso } from '../shared/ids.js';
import { offerCreateSchema, offerUpdateSchema, parseBody } from '../shared/schemas.js';
import { created, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import type { SpecialOffer } from '../shared/types.js';

const OFFERS_KEY = 'offers';

async function loadOffers(): Promise<SpecialOffer[]> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { key: OFFERS_KEY } })
  );
  return (res.Item?.value as SpecialOffer[]) ?? [];
}

async function saveOffers(offers: SpecialOffer[]): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLES.settings,
      Item: { key: OFFERS_KEY, value: offers, updatedAt: nowIso() },
    })
  );
}

async function getActiveOffers(_event: APIGatewayProxyEventV2, origin?: string) {
  const offers = await loadOffers();
  const now = Date.now();
  const active = offers
    .filter((o) => o.isActive)
    .filter((o) => !o.validFrom || new Date(o.validFrom).getTime() <= now)
    .filter((o) => !o.validUntil || new Date(o.validUntil).getTime() >= now)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return ok(active, origin);
}

async function listOffers(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const offers = (await loadOffers()).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );
  return ok(offers, origin);
}

async function createOffer(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const input = parseBody(offerCreateSchema, event.body);
  const ts = nowIso();
  const offer: SpecialOffer = {
    id: newId(),
    ...input,
    createdAt: ts,
    updatedAt: ts,
  };
  const offers = await loadOffers();
  offers.push(offer);
  await saveOffers(offers);
  return created(offer, origin);
}

async function updateOffer(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Offer id required');
  const updates = parseBody(offerUpdateSchema, event.body);

  const offers = await loadOffers();
  const idx = offers.findIndex((o) => o.id === id);
  if (idx === -1) return notFound('Offer not found', origin);

  offers[idx] = { ...offers[idx], ...updates, id, updatedAt: nowIso() };
  await saveOffers(offers);
  return ok(offers[idx], origin);
}

async function deleteOffer(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Offer id required');

  const offers = await loadOffers();
  const existing = offers.find((offer) => offer.id === id);
  if (!existing) return notFound('Offer not found', origin);

  await saveOffers(offers.filter((offer) => offer.id !== id));
  return ok({ success: true }, origin);
}

export const handler = createRouter({
  'GET /offers': getActiveOffers,
  'GET /admin/offers': listOffers,
  'POST /admin/offers': createOffer,
  'PUT /admin/offers/{id}': updateOffer,
  'DELETE /admin/offers/{id}': deleteOffer,
});
