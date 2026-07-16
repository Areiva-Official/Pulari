// ─────────────────────────────────────────────────────────────────────────────
// MENU HANDLER
//   GET    /menu/categories          (public)
//   GET    /menu/items               (public, ?categoryId=)
//   GET    /menu/items/{id}          (public)
//   POST   /admin/menu/items         (admin)
//   PUT    /admin/menu/items/{id}    (admin)
//   DELETE /admin/menu/items/{id}    (admin)
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { requireAdmin } from '../shared/auth.js';
import { newId, nowIso } from '../shared/ids.js';
import { menuItemCreateSchema, menuItemUpdateSchema, parseBody } from '../shared/schemas.js';
import { created, noContent, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import type { MenuItem } from '../shared/types.js';

// Canonical names for the fixed numeric menu category ids. Items also store a
// categoryName, but this map guarantees a friendly name even for items created
// before that field existed (or via older clients).
const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Starters',
  '2': 'Main Course',
  '3': 'Breads & Rice',
  '4': 'Beverages & Desserts',
};

function categoryNameFor(id: string, stored?: string): string {
  if (stored && stored.trim()) return stored.trim();
  return CATEGORY_NAMES[id] ?? `Category ${id}`;
}

// Derive distinct categories from menu items (no separate category table).
async function getCategories(_event: APIGatewayProxyEventV2, origin?: string) {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.menu }));
  const items = (res.Items ?? []) as MenuItem[];
  const names = new Map<string, string>();
  for (const item of items) {
    const id = item.categoryId || 'uncategorised';
    if (!names.has(id)) names.set(id, categoryNameFor(id, item.categoryName));
  }
  const categories = [...names.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    .map(([id, name], i) => ({
      id,
      name,
      slug: id,
      displayOrder: i,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }));
  return ok(categories, origin);
}

async function getItems(event: APIGatewayProxyEventV2, origin?: string) {
  const categoryId = event.queryStringParameters?.categoryId;

  if (categoryId) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.menu,
        IndexName: 'categoryIndex',
        KeyConditionExpression: 'category = :c',
        ExpressionAttributeValues: { ':c': categoryId },
      })
    );
    return ok(res.Items ?? [], origin);
  }

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.menu }));
  const items = ((res.Items ?? []) as MenuItem[]).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
  return ok(items, origin);
}

async function getItem(event: APIGatewayProxyEventV2, origin?: string) {
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Item id required');
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.menu, Key: { id } })
  );
  if (!res.Item) return notFound('Item not found', origin);
  return ok(res.Item, origin);
}

async function createItem(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const input = parseBody(menuItemCreateSchema, event.body);
  const ts = nowIso();
  const item: MenuItem = {
    id: newId(),
    ...input,
    // GSI projection keys
    category: input.categoryId,
    categoryName: categoryNameFor(input.categoryId),
    sortOrder: input.displayOrder,
    createdAt: ts,
    updatedAt: ts,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.menu, Item: item }));
  return created(item, origin);
}

async function updateItem(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Item id required');

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.menu, Key: { id } })
  );
  if (!existing.Item) return notFound('Item not found', origin);

  const updates = parseBody(menuItemUpdateSchema, event.body);
  const merged: MenuItem = {
    ...(existing.Item as MenuItem),
    ...updates,
    id,
    updatedAt: nowIso(),
  };
  // Keep GSI keys + denormalised category name in sync.
  if (updates.categoryId) {
    merged.category = updates.categoryId;
    merged.categoryName = categoryNameFor(updates.categoryId);
  }
  if (updates.displayOrder !== undefined) merged.sortOrder = updates.displayOrder;

  await ddb.send(new PutCommand({ TableName: TABLES.menu, Item: merged }));
  return ok(merged, origin);
}

async function deleteItem(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Item id required');
  await ddb.send(new DeleteCommand({ TableName: TABLES.menu, Key: { id } }));
  return noContent(origin);
}

export const handler = createRouter({
  'GET /menu/categories': getCategories,
  'GET /menu/items': getItems,
  'GET /menu/items/{id}': getItem,
  'POST /admin/menu/items': createItem,
  'PUT /admin/menu/items/{id}': updateItem,
  'DELETE /admin/menu/items/{id}': deleteItem,
});
