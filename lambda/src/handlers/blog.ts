// ─────────────────────────────────────────────────────────────────────────────
// BLOG HANDLER
//   GET    /blog                     (public — published only; admins see all)
//   GET    /blog/{slug}              (public — published; admins see drafts too)
//   POST   /admin/blog               (admin)
//   PUT    /admin/blog/{id}          (admin)
//   DELETE /admin/blog/{id}          (admin)
//   PATCH  /admin/blog/{id}/publish  (admin)
// Stored in the dedicated pulari-blog table (PK = id). Blog is low-volume, so
// list/slug lookups Scan + filter in-memory (mirrors the menu handler).
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES } from '../shared/dynamo.js';
import { optionalAuth, requireAdmin } from '../shared/auth.js';
import { newId, nowIso } from '../shared/ids.js';
import { blogCreateSchema, blogUpdateSchema, parseBody } from '../shared/schemas.js';
import { created, noContent, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import type { BlogPost } from '../shared/types.js';

async function loadAll(): Promise<BlogPost[]> {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.blog }));
  return (res.Items ?? []) as BlogPost[];
}

// Newest first — by publish date when present, else creation date.
function sortNewest(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const ad = new Date(a.publishedAt ?? a.createdAt).getTime();
    const bd = new Date(b.publishedAt ?? b.createdAt).getTime();
    return bd - ad;
  });
}

async function listPosts(event: APIGatewayProxyEventV2, origin?: string) {
  // Public route, but admins get all statuses when a valid token is attached.
  const auth = await optionalAuth(event);
  const all = sortNewest(await loadAll());
  const visible = auth?.isAdmin
    ? all
    : all.filter((p) => p.status === 'published');

  const categoryId = event.queryStringParameters?.categoryId;
  const filtered = categoryId
    ? visible.filter((p) => p.categoryId === categoryId)
    : visible;

  const page = Math.max(1, Number(event.queryStringParameters?.page ?? '1') || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(event.queryStringParameters?.pageSize ?? '20') || 20)
  );
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return ok(
    {
      items,
      total: filtered.length,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
    },
    origin
  );
}

async function getPostBySlug(event: APIGatewayProxyEventV2, origin?: string) {
  const slug = event.pathParameters?.slug;
  if (!slug) throw new NotFoundError('Slug required');
  const auth = await optionalAuth(event);
  const found = (await loadAll()).find((p) => p.slug === slug);
  if (!found) return notFound('Post not found', origin);
  if (found.status !== 'published' && !auth?.isAdmin) {
    return notFound('Post not found', origin);
  }
  return ok(found, origin);
}

async function createPost(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const input = parseBody(blogCreateSchema, event.body);
  const ts = nowIso();
  const post: BlogPost = {
    id: newId(),
    ...input,
    publishedAt: input.status === 'published' ? ts : undefined,
    createdAt: ts,
    updatedAt: ts,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.blog, Item: post }));
  return created(post, origin);
}

async function updatePost(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Post id required');

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.blog, Key: { id } })
  );
  if (!existing.Item) return notFound('Post not found', origin);

  const prev = existing.Item as BlogPost;
  const updates = parseBody(blogUpdateSchema, event.body);
  const merged: BlogPost = { ...prev, ...updates, id, updatedAt: nowIso() };

  // Stamp publishedAt the first time a post goes live.
  if (merged.status === 'published' && !prev.publishedAt) {
    merged.publishedAt = nowIso();
  }

  await ddb.send(new PutCommand({ TableName: TABLES.blog, Item: merged }));
  return ok(merged, origin);
}

async function deletePost(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Post id required');
  await ddb.send(new DeleteCommand({ TableName: TABLES.blog, Key: { id } }));
  return noContent(origin);
}

async function publishPost(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Post id required');

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.blog, Key: { id } })
  );
  if (!existing.Item) return notFound('Post not found', origin);

  const prev = existing.Item as BlogPost;
  const merged: BlogPost = {
    ...prev,
    status: 'published',
    publishedAt: prev.publishedAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.blog, Item: merged }));
  return ok(merged, origin);
}

export const handler = createRouter({
  'GET /blog': listPosts,
  'GET /blog/{slug}': getPostBySlug,
  'POST /admin/blog': createPost,
  'PUT /admin/blog/{id}': updatePost,
  'DELETE /admin/blog/{id}': deletePost,
  'PATCH /admin/blog/{id}/publish': publishPost,
});
