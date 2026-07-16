// ─────────────────────────────────────────────────────────────────────────────
// COUPONS HANDLER
//   POST  /coupons/validate     (public — re-validated again at order time)
//   GET   /admin/coupons        (admin)
//   POST  /admin/coupons        (admin)
//   PATCH /admin/coupons/{id}   (admin — toggle active; {id} == coupon code)
// PK of pulari-coupons is `code`, so the {id} path param is treated as the code.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { requireAdmin } from '../shared/auth.js';
import { nowIso } from '../shared/ids.js';
import {
  createCouponSchema,
  parseBody,
  toggleCouponSchema,
  validateCouponSchema,
} from '../shared/schemas.js';
import { badRequest, created, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import type { Coupon } from '../shared/types.js';

const money = (n: number): number => Math.round(n * 100) / 100;

async function validateCoupon(event: APIGatewayProxyEventV2, origin?: string) {
  const { code, orderAmount } = parseBody(validateCouponSchema, event.body);
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLES.coupons,
      Key: { code: code.toUpperCase() },
    })
  );
  const coupon = res.Item as Coupon | undefined;
  if (!coupon || !coupon.isActive) {
    return badRequest('Invalid or inactive coupon', origin);
  }

  const now = Date.now();
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now)
    return badRequest('Coupon not yet valid', origin);
  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now)
    return badRequest('Coupon has expired', origin);
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount)
    return badRequest(
      `Minimum order of €${coupon.minOrderAmount} required`,
      origin
    );
  if (coupon.maxUsesTotal && coupon.currentUses >= coupon.maxUsesTotal)
    return badRequest('Coupon usage limit reached', origin);

  let discount = 0;
  if (coupon.type === 'percentage') discount = (orderAmount * coupon.value) / 100;
  else if (coupon.type === 'fixed') discount = coupon.value;
  discount = money(Math.min(discount, orderAmount));

  return ok({ ...coupon, computedDiscount: discount }, origin);
}

async function listCoupons(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.coupons }));
  const items = ((res.Items ?? []) as Coupon[]).sort((a, b) =>
    (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  );
  return ok(items, origin);
}

async function createCoupon(event: APIGatewayProxyEventV2, origin?: string) {
  const auth = await requireAdmin(event);
  const input = parseBody(createCouponSchema, event.body);
  const code = input.code.toUpperCase();

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.coupons, Key: { code } })
  );
  if (existing.Item) return badRequest('Coupon code already exists', origin);

  const coupon: Coupon = {
    id: code,
    code,
    type: input.type,
    value: input.value,
    minOrderAmount: input.minOrderAmount,
    maxUsesTotal: input.maxUsesTotal,
    maxUsesPerCustomer: input.maxUsesPerCustomer,
    currentUses: 0,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    isActive: input.isActive,
    createdAt: nowIso(),
    createdBy: auth.email,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.coupons, Item: coupon }));
  return created(coupon, origin);
}

async function toggleCoupon(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const code = event.pathParameters?.id;
  if (!code) throw new NotFoundError('Coupon code required');
  const { isActive } = parseBody(toggleCouponSchema, event.body);

  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLES.coupons,
      Key: { code: code.toUpperCase() },
    })
  );
  if (!existing.Item) return notFound('Coupon not found', origin);

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.coupons,
      Key: { code: code.toUpperCase() },
      UpdateExpression: 'SET isActive = :a',
      ExpressionAttributeValues: { ':a': isActive },
      ReturnValues: 'ALL_NEW',
    })
  );
  return ok(res.Attributes, origin);
}

export const handler = createRouter({
  'POST /coupons/validate': validateCoupon,
  'GET /admin/coupons': listCoupons,
  'POST /admin/coupons': createCoupon,
  'PATCH /admin/coupons/{id}': toggleCoupon,
});
