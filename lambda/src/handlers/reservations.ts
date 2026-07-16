// ─────────────────────────────────────────────────────────────────────────────
// RESERVATIONS HANDLER
//   POST  /reservations                      (public)
//   GET   /reservations/{id}                 (public)
//   GET   /admin/reservations                (admin, ?date= ?status=)
//   PATCH /admin/reservations/{id}/status    (admin)
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
import {
  createReservationSchema,
  parseBody,
  reservationStatusSchema,
} from '../shared/schemas.js';
import { created, notFound, ok } from '../shared/response.js';
import { createRouter, NotFoundError } from '../shared/router.js';
import { logAuditEvent } from '../shared/audit.js';
import { sendReservationConfirmed, notifyNewReservation } from '../shared/email.js';
import type { PaginatedResponse, Reservation } from '../shared/types.js';

async function createReservation(event: APIGatewayProxyEventV2, origin?: string) {
  const input = parseBody(createReservationSchema, event.body);
  const auth = await optionalAuth(event);
  const ts = nowIso();

  const reservation: Reservation = {
    id: newId(),
    customerId: auth?.sub,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    userEmail: (auth?.email || input.customerEmail).toLowerCase(),
    date: input.date,
    time: input.time,
    reservationDate: input.date,
    reservationTime: input.time,
    guests: input.guests,
    status: 'pending',
    notes: input.notes,
    createdAt: ts,
    updatedAt: ts,
  };

  await ddb.send(
    new PutCommand({ TableName: TABLES.reservations, Item: reservation })
  );

  // Transactional emails (fire-and-forget)
  void sendReservationConfirmed(reservation);
  void notifyNewReservation(reservation);

  void logAuditEvent({
    eventType: 'reservation.created',
    actorId: auth?.sub,
    actorLabel: reservation.customerEmail,
    resourceId: reservation.id,
    data: {
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
    },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  return created(reservation, origin);
}

async function getReservation(event: APIGatewayProxyEventV2, origin?: string) {
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Reservation id required');
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.reservations, Key: { id } })
  );
  if (!res.Item) return notFound('Reservation not found', origin);
  return ok(res.Item, origin);
}

async function listReservations(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);
  const date = event.queryStringParameters?.date;
  const status = event.queryStringParameters?.status;

  let items: Reservation[];
  if (date) {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.reservations,
        IndexName: 'dateIndex',
        KeyConditionExpression: 'reservationDate = :d',
        ExpressionAttributeValues: { ':d': date },
      })
    );
    items = (res.Items ?? []) as Reservation[];
  } else {
    const res = await ddb.send(
      new ScanCommand({ TableName: TABLES.reservations })
    );
    items = (res.Items ?? []) as Reservation[];
  }

  if (status) items = items.filter((r) => r.status === status);
  items.sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
  );

  const page: PaginatedResponse<Reservation> = {
    items,
    total: items.length,
    page: 1,
    pageSize: items.length,
    hasMore: false,
  };
  return ok(page, origin);
}

async function updateReservationStatus(
  event: APIGatewayProxyEventV2,
  origin?: string
) {
  await requireAdmin(event);
  const id = event.pathParameters?.id;
  if (!id) throw new NotFoundError('Reservation id required');
  const { status, tableNumber } = parseBody(
    reservationStatusSchema,
    event.body
  );

  const existing = await ddb.send(
    new GetCommand({ TableName: TABLES.reservations, Key: { id } })
  );
  if (!existing.Item) return notFound('Reservation not found', origin);

  const ts = nowIso();
  const confirmedAt =
    status === 'confirmed'
      ? ts
      : (existing.Item as Reservation).confirmedAt ?? null;

  const res = await ddb.send(
    new UpdateCommand({
      TableName: TABLES.reservations,
      Key: { id },
      UpdateExpression:
        'SET #s = :s, updatedAt = :u, confirmedAt = :c, tableNumber = :t',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':s': status,
        ':u': ts,
        ':c': confirmedAt,
        ':t': tableNumber ?? (existing.Item as Reservation).tableNumber ?? null,
      },
      ReturnValues: 'ALL_NEW',
    })
  );
  void logAuditEvent({
    eventType: 'reservation.status_changed',
    actorLabel: 'admin',
    resourceId: id,
    data: {
      status,
      previousStatus: (existing.Item as Reservation).status,
      tableNumber: tableNumber ?? null,
    },
    sourceIp: event.requestContext?.http?.sourceIp,
  });

  return ok(res.Attributes, origin);
}

export const handler = createRouter({
  'POST /reservations': createReservation,
  'GET /reservations/{id}': getReservation,
  'GET /admin/reservations': listReservations,
  'PATCH /admin/reservations/{id}/status': updateReservationStatus,
});
