// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS HANDLER
//   GET /admin/analytics/summary   (admin)
// Computes today / week / month revenue + counts, AOV, popular items, recents
// from the orders table. Only paid/confirmed+ orders count toward revenue.
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { requireAdmin } from '../shared/auth.js';
import { ok } from '../shared/response.js';
import { createRouter } from '../shared/router.js';
import type { Order } from '../shared/types.js';

const REVENUE_STATUSES = new Set([
  'paid',
  'confirmed',
  'preparing',
  'ready',
  'completed',
]);

const money = (n: number): number => Math.round(n * 100) / 100;

function startOfTodayUtc(): number {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

async function getSummary(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.orders }));
  const orders = (res.Items ?? []) as Order[];

  const now = Date.now();
  const dayStart = startOfTodayUtc();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  let ordersToday = 0;
  let revenueToday = 0;
  let ordersWeek = 0;
  let revenueWeek = 0;
  let ordersMonth = 0;
  let revenueMonth = 0;
  let revenueAllCount = 0;
  let revenueAllSum = 0;

  const itemCounts = new Map<string, { name: string; count: number }>();

  for (const o of orders) {
    const ts = new Date(o.createdAt).getTime();
    const counts = REVENUE_STATUSES.has(o.status);
    const total = counts ? o.total : 0;

    if (ts >= dayStart) {
      ordersToday += 1;
      revenueToday += total;
    }
    if (ts >= weekAgo) {
      ordersWeek += 1;
      revenueWeek += total;
    }
    if (ts >= monthAgo) {
      ordersMonth += 1;
      revenueMonth += total;
    }
    if (counts) {
      revenueAllCount += 1;
      revenueAllSum += o.total;
    }

    for (const item of o.items ?? []) {
      const entry = itemCounts.get(item.menuItemId) ?? {
        name: item.name,
        count: 0,
      };
      entry.count += item.quantity;
      itemCounts.set(item.menuItemId, entry);
    }
  }

  const popularItems = [...itemCounts.entries()]
    .map(([itemId, v]) => ({ itemId, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const summary = {
    totalOrdersToday: ordersToday,
    totalRevenueToday: money(revenueToday),
    totalOrdersThisWeek: ordersWeek,
    totalRevenueThisWeek: money(revenueWeek),
    totalOrdersThisMonth: ordersMonth,
    totalRevenueThisMonth: money(revenueMonth),
    averageOrderValue:
      revenueAllCount > 0 ? money(revenueAllSum / revenueAllCount) : 0,
    popularItems,
    recentOrders,
  };

  return ok(summary, origin);
}

export const handler = createRouter({
  'GET /admin/analytics/summary': getSummary,
});
