// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS HANDLER
//   GET   /reviews                    (public — approved only)
//   POST  /reviews                    (public — submitted as pending)
//   GET   /admin/reviews              (admin — all)
//   PATCH /admin/reviews/{id}/approve (admin)
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
import { newId, nowIso } from '../shared/ids.js';
import { parseBody, submitReviewSchema } from '../shared/schemas.js';
import { created, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import type { Review } from '../shared/types.js';

async function getApprovedReviews(_event: APIGatewayProxyEventV2, origin?: string) {
  const res = await ddb.send(
    new QueryCommand({
      TableName: TABLES.reviews,
      IndexName: 'statusIndex',
      KeyConditionExpression: '#s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'approved' },
      ScanIndexForward: false,
    })
  );
  return ok((res.Items ?? []) as Review[], origin);
}

async function submitReview(event: APIGatewayProxyEventV2, origin?: string) {
  const input = parseBody(submitReviewSchema, event.body);
  const auth = await optionalAuth(event);
  const ts = nowIso();

  const review: Review = {
    id: newId(),
    customerId: auth?.sub,
    customerName: input.customerName,
    rating: input.rating,
    comment: input.comment,
    isApproved: false,
    isHighlighted: false,
    orderId: input.orderId,
    menuItemId: 'general',
    status: 'pending',
    createdAt: ts,
  };

  await ddb.send(new PutCommand({ TableName: TABLES.reviews, Item: review }));
  return created(review, origin);
}

async function listReviews(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.reviews }));
  const items = ((res.Items ?? []) as Review[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return ok(items, origin);
}

async function approveReview(event: APIGatewayProxyEventV2, origin?: string) {
  const auth = await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Review id required');

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.reviews, Key: { id } })
  );
  if (!existing.Item) return notFound('Review not found', origin);

  const ts = nowIso();
  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.reviews,
      Key: { id },
      UpdateExpression:
        'SET #s = :s, isApproved = :a, approvedAt = :t, approvedBy = :b',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': 'approved',
        ':a': true,
        ':t': ts,
        ':b': auth.email,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  return ok(res.Attributes, origin);
}

export const handler = createRouter({
  'GET /reviews': getApprovedReviews,
  'POST /reviews': submitReview,
  'GET /admin/reviews': listReviews,
  'PATCH /admin/reviews/{id}/approve': approveReview,
});
