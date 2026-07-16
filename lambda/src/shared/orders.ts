// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATE TRANSITIONS — shared by the payments handler and the Stripe
// webhook so fulfilment logic is defined exactly once. All transitions are
// idempotent via DynamoDB ConditionExpressions (safe under webhook retries).
// ─────────────────────────────────────────────────────────────────────────────
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { ddb, TABLES } from './dynamo.js';
import { nowIso } from './ids.js';
import type { Order } from './types.js';

export async function getOrder(id: string): Promise<Order | null> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.orders, Key: { id } })
  );
  return (res.Item as Order) ?? null;
}

export async function attachPaymentIntent(
  orderId: string,
  paymentIntentId: string
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.orders,
      Key: { id: orderId },
      UpdateExpression: 'SET paymentIntentId = :pi, updatedAt = :u',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: { ':pi': paymentIntentId, ':u': nowIso() },
    })
  );
}

// Idempotent: transitions pending → paid exactly once. Returns true if THIS call
// performed the transition, false if it was already paid (no-op).
export async function markOrderPaid(
  orderId: string,
  paymentIntentId: string
): Promise<boolean> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.orders,
        Key: { id: orderId },
        UpdateExpression:
          'SET paymentStatus = :succeeded, #st = :paid, paymentIntentId = :pi, updatedAt = :u',
        ConditionExpression:
          'attribute_exists(id) AND paymentStatus <> :succeeded',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':succeeded': 'succeeded',
          ':paid': 'paid',
          ':pi': paymentIntentId,
          ':u': nowIso(),
        },
      })
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false; // already paid
    throw err;
  }
}

export async function markOrderFailed(orderId: string): Promise<void> {
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.orders,
        Key: { id: orderId },
        UpdateExpression: 'SET paymentStatus = :failed, updatedAt = :u',
        // Never override a successful payment with a late failure event.
        ConditionExpression:
          'attribute_exists(id) AND paymentStatus <> :succeeded',
        ExpressionAttributeValues: {
          ':failed': 'failed',
          ':succeeded': 'succeeded',
          ':u': nowIso(),
        },
      })
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return;
    throw err;
  }
}

export async function markOrderRefunded(
  orderId: string,
  fullyRefunded: boolean
): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.orders,
      Key: { id: orderId },
      UpdateExpression: 'SET paymentStatus = :p, #st = :refunded, updatedAt = :u',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':p': fullyRefunded ? 'refunded' : 'partially_refunded',
        ':refunded': 'refunded',
        ':u': nowIso(),
      },
    })
  );
}
