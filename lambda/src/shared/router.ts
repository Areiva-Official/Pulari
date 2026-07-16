// ─────────────────────────────────────────────────────────────────────────────
// MINIMAL ROUTER for API Gateway HTTP API (v2) — matches event.routeKey and
// dispatches to a handler. Centralises auth-error → HTTP response mapping.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { AuthError } from './auth.js';
import { ValidationError } from './schemas.js';
import { badRequest, forbidden, json, notFound, preflight, serverError, unauthorized } from './response.js';

export type RouteHandler = (
  event: APIGatewayProxyEventV2,
  origin?: string
) => Promise<APIGatewayProxyStructuredResultV2>;

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

// routeKey examples: "GET /menu/items", "POST /admin/menu/items", "GET /menu/items/{id}"
export function createRouter(routes: Record<string, RouteHandler>) {
  return async (
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    const origin = event.headers?.origin ?? event.headers?.Origin;
    const routeKey = event.routeKey ?? '';

    // CORS preflight is handled by API Gateway, but answer defensively.
    if (event.requestContext?.http?.method === 'OPTIONS') {
      return preflight(origin);
    }

    const handler = routes[routeKey];
    if (!handler) {
      return notFound(`No route for ${routeKey}`, origin);
    }

    try {
      return await handler(event, origin);
    } catch (err) {
      if (err instanceof AuthError) {
        return err.statusCode === 403
          ? forbidden(err.message, origin)
          : unauthorized(err.message, origin);
      }
      if (err instanceof ValidationError) {
        return badRequest(err.message, origin);
      }
      if (err instanceof NotFoundError) {
        return notFound(err.message || 'Not found', origin);
      }
      if (err instanceof ConflictError) {
        return badRequest(err.message, origin);
      }
      // Any error carrying an explicit httpStatus (e.g. PaymentsNotConfigured).
      const tagged = err as { httpStatus?: number; message?: string };
      if (typeof tagged.httpStatus === 'number') {
        return json(tagged.httpStatus, { message: tagged.message ?? 'Error' }, origin);
      }
      console.error(`[${routeKey}] Unhandled error:`, err);
      return serverError('Internal server error', origin);
    }
  };
}
