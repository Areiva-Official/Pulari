// ─────────────────────────────────────────────────────────────────────────────
// ORDERS HANDLER
//   POST  /orders                       (public/guest — server recomputes price)
//   GET   /orders/{id}                  (public — by id)
//   GET   /orders/my                    (authenticated — caller's orders)
//   GET   /admin/orders                 (admin — list, ?status=)
//   PATCH /admin/orders/{id}/status     (admin)
//
// PRICING INTEGRITY: the server NEVER trusts client-supplied prices. Every line
// price is re-read from the menu table; tax/service from settings; coupon is
// re-validated server-side. This is the core anti-tampering control.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { optionalAuth, requireAdmin } from '../shared/auth.js';
import { newId, newOrderNumber, nowIso } from '../shared/ids.js';
import { createOrderSchema, orderStatusSchema, parseBody } from '../shared/schemas.js';
import { created, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import { logAuditEvent } from '../shared/audit.js';
import { sendOrderReceived, notifyNewOrder } from '../shared/email.js';
import type { Coupon, MenuItem, Order, OrderItem, PaginatedResponse } from '../shared/types.js';

const money = (n: number): number => Math.round(n * 100) / 100;

interface SettingsBlob {
  taxPercent?: number;
  serviceChargePercent?: number;
  minimumOrderAmount?: number;
  enableOnlineOrdering?: boolean;
}

async function loadSettings(): Promise<SettingsBlob> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.settings, Key: { key: 'restaurant' } })
  );
  return (res.Item?.value as SettingsBlob) ?? {};
}

// Re-validate a coupon server-side; returns discount amount (never negative).
async function computeCouponDiscount(
  code: string,
  subtotal: number
): Promise<{ discount: number; coupon: Coupon | null }> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.coupons, Key: { code: code.toUpperCase() } })
  );
  const coupon = res.Item as Coupon | undefined;
  if (!coupon || !coupon.isActive) return { discount: 0, coupon: null };

  const now = Date.now();
  if (coupon.validFrom && new Date(coupon.validFrom).getTime() > now)
    return { discount: 0, coupon: null };
  if (coupon.validUntil && new Date(coupon.validUntil).getTime() < now)
    return { discount: 0, coupon: null };
  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount)
    return { discount: 0, coupon: null };
  if (coupon.maxUsesTotal && coupon.currentUses >= coupon.maxUsesTotal)
    return { discount: 0, coupon: null };

  let discount = 0;
  if (coupon.type === 'percentage') discount = (subtotal * coupon.value) / 100;
  else if (coupon.type === 'fixed') discount = coupon.value;
  discount = Math.min(discount, subtotal); // never exceed subtotal
  return { discount: money(discount), coupon };
}

async function createOrder(event: APIGatewayProxyEventV2, origin?: string) {
  const input = parseBody(createOrderSchema, event.body);
  const auth = await optionalAuth(event); // guests allowed
  const settings = await loadSettings();

  if (settings.enableOnlineOrdering === false) {
    throw new NotFoundError('Online ordering is currently disabled');
  }

  // Re-price every line from the authoritative menu table.
  const orderItems: OrderItem[] = [];
  let subtotal = 0;
  for (const line of input.items) {
    const res = await ddb.send(
      new GetCommand({ TableName: TABLES.menu, Key: { id: line.menuItemId } })
    );
    const menuItem = res.Item as MenuItem | undefined;
    if (!menuItem) {
      throw new NotFoundError(`Menu item not found: ${line.menuItemId}`);
    }
    if (menuItem.isAvailable === false) {
      throw new NotFoundError(`Item unavailable: ${menuItem.name}`);
    }
    const lineSubtotal = money(menuItem.price * line.quantity);
    subtotal += lineSubtotal;
    orderItems.push({
      id: newId(),
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: line.quantity,
      specialInstructions: line.specialInstructions,
      subtotal: lineSubtotal,
    });
  }
  subtotal = money(subtotal);

  // Server-side coupon re-validation.
  let discountAmount = 0;
  let appliedCoupon: Coupon | null = null;
  if (input.couponCode) {
    const result = await computeCouponDiscount(input.couponCode, subtotal);
    discountAmount = result.discount;
    appliedCoupon = result.coupon;
  }

  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = money((taxableBase * (settings.taxPercent ?? 0)) / 100);
  const serviceCharge = money(
    (taxableBase * (settings.serviceChargePercent ?? 0)) / 100
  );
  const total = money(subtotal - discountAmount + taxAmount + serviceCharge);

  const ts = nowIso();
  const order: Order = {
    id: newId(),
    orderNumber: newOrderNumber(),
    customerId: auth?.sub,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    userEmail: (auth?.email || input.customerEmail).toLowerCase(),
    type: input.type,
    status: 'pending',
    paymentStatus: 'pending',
    items: orderItems,
    subtotal,
    taxAmount,
    discountAmount,
    serviceCharge,
    total,
    couponCode: appliedCoupon?.code,
    notes: input.notes,
    createdAt: ts,
    updatedAt: ts,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.orders, Item: order }));

  // Transactional emails (fire-and-forget — never blocks the response)
  void sendOrderReceived(order);
  void notifyNewOrder(order);

  // Audit log (fire-and-forget — never blocks the response)
  void logAuditEvent({
    eventType: 'order.created',
    actorId: auth?.sub,
    actorLabel: order.customerEmail,
    resourceId: order.id,
    data: {
      orderNumber: order.orderNumber,
      type: order.type,
      total: order.total,
      itemCount: orderItems.length,
      couponCode: appliedCoupon?.code ?? null,
    },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  // Best-effort coupon usage increment.
  if (appliedCoupon) {
    await ddb
      .send(
        new UpdateCommand({
          TableName: TABLES.coupons,
          Key: { code: appliedCoupon.code },
          UpdateExpression: 'SET currentUses = if_not_exists(currentUses, :z) + :one',
          ExpressionAttributeValues: { ':one': 1, ':z': 0 },
        })
      )
      .catch((e) => console.error('coupon increment failed', e));
  }

  return created(order, origin);
}

async function getOrder(event: APIGatewayProxyEventV2, origin?: string) {
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Order id required');
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.orders, Key: { id } })
  );
  if (!res.Item) return notFound('Order not found', origin);
  return ok(res.Item, origin);
}

async function getMyOrders(event: APIGatewayProxyEventV2, origin?: string) {
  const auth = await optionalAuth(event);
  if (!auth) {
    const empty: PaginatedResponse<Order> = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 0,
      hasMore: false,
    };
    return ok(empty, origin);
  }
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.orders,
      IndexName: 'userEmailIndex',
      KeyConditionExpression: 'userEmail = :e',
      ExpressionAttributeValues: { ':e': auth.email.toLowerCase() },
      ScanIndexForward: false,
    })
  );
  const items = (res.Items ?? []) as Order[];
  const page: PaginatedResponse<Order> = {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
    hasMore: false,
  };
  return ok(page, origin);
}

async function listOrders(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const status = event.queryStringParameters?.status;

  let items: Order[];
  if (status) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.orders,
        IndexName: 'statusIndex',
        KeyConditionExpression: '#s = :s',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': status },
        ScanIndexForward: false,
      })
    );
    items = (res.Items ?? []) as Order[];
  } else {
    const res = await ddb.send(new ScanCommand({ TableName: TABLES.orders }));
    items = ((res.Items ?? []) as Order[]).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  const page: PaginatedResponse<Order> = {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
    hasMore: false,
  };
  return ok(page, origin);
}

async function updateOrderStatus(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Order id required');
  const { status } = parseBody(orderStatusSchema, event.body);

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.orders, Key: { id } })
  );
  if (!existing.Item) return notFound('Order not found', origin);

  const ts = nowIso();
  const completedAt = status === 'completed' ? ts : (existing.Item as Order).completedAt;
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.orders,
      Key: { id },
      UpdateExpression:
        'SET #s = :s, updatedAt = :u, completedAt = :c',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': status, ':u': ts, ':c': completedAt ?? null },
      ReturnValues: 'ALL_NEW',
    })
  );
  void logAuditEvent({
    eventType: 'order.status_changed',
    actorLabel: 'admin',
    resourceId: id,
    data: { status, previousStatus: (existing.Item as Order).status },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  return ok(res.Attributes, origin);
}

export const handler = createRouter({
  'POST /orders': createOrder,
  'GET /orders/my': getMyOrders,
  'GET /orders/{id}': getOrder,
  'GET /admin/orders': listOrders,
  'PATCH /admin/orders/{id}/status': updateOrderStatus,
});
