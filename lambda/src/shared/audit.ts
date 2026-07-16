// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG — write-once append to pulari-audit DynamoDB table.
//
// Design:
//   • Partition key  = id         (nanoid — unique per event)
//   • Sort key       = createdAt  (ISO 8601 — enables time-range queries)
//   • No updates, no deletes on this table (enforced by IAM in prod via a
//     separate policy that only allows PutItem on pulari-audit)
//   • Fire-and-forget: failures are logged to CloudWatch but never thrown —
//     an audit write must never fail a customer-facing request
//
// Event types (extend freely; use lowercase_snake_case):
//   order.created          order.status_changed
//   payment.intent_created payment.refunded      payment.succeeded
//   reservation.created    reservation.status_changed
//   admin.login            admin.action
// ─────────────────────────────────────────────────────────────────────────────
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb } from './dynamo.js';
import { newId, nowIso } from './ids.js';

const TABLE = process.env.TABLE_AUDIT ?? 'pulari-audit';

export interface AuditEvent {
  /** Dot-namespaced event type, e.g. "order.created" */
  eventType: string;
  /** Cognito sub or 'system' */
  actorId?: string;
  /** Human-readable actor label, e.g. email or 'webhook' */
  actorLabel?: string;
  /** Primary resource being acted on, e.g. order id */
  resourceId?: string;
  /** Flat key/value bag — keep PII minimal */
  data?: Record<string, unknown>;
  /** Originating IP (from API Gateway event, if available) */
  sourceIp?: string;
}

/**
 * Write one audit event. Never throws — all errors go to CloudWatch Logs.
 * Call with `void logAuditEvent(...)` (fire-and-forget) from handlers.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const id = newId();
  const createdAt = nowIso();
  try {
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: {
          id,
          createdAt,
          eventType: event.eventType,
          actorId: event.actorId ?? 'system',
          actorLabel: event.actorLabel ?? 'system',
          resourceId: event.resourceId ?? null,
          data: event.data ?? {},
          sourceIp: event.sourceIp ?? null,
        },
        // Prevent accidental overwrites (id is random, so this is just a safety net)
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );
  } catch (err) {
    // Log but never surface to the caller
    console.error('[audit] failed to write event', {
      eventType: event.eventType,
      resourceId: event.resourceId,
      error: (err as Error).message,
    });
  }
}
