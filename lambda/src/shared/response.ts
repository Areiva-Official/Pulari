// ─────────────────────────────────────────────────────────────────────────────
// HTTP RESPONSE HELPERS — consistent JSON + CORS for API Gateway HTTP API (v2)
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

// Allowed origins. Production locks to the live domains; dev allows localhost.
const ALLOWED_ORIGINS = [
  'https://www.pulari.ie',
  'https://pulari.ie',
  'http://localhost:5173',
  'http://localhost:4173',
];

function corsHeaders(origin?: string): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '3600',
    Vary: 'Origin',
  };
}

export function json(
  statusCode: number,
  body: unknown,
  origin?: string
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(origin),
    },
    body: JSON.stringify(body),
  };
}

export const ok = (data: unknown, origin?: string) => json(200, data, origin);
export const created = (data: unknown, origin?: string) => json(201, data, origin);
export const noContent = (origin?: string): APIGatewayProxyStructuredResultV2 => ({
  statusCode: 204,
  headers: corsHeaders(origin),
  body: '',
});

export const badRequest = (message: string, origin?: string) =>
  json(400, { message }, origin);
export const unauthorized = (message = 'Unauthorized', origin?: string) =>
  json(401, { message }, origin);
export const forbidden = (message = 'Forbidden', origin?: string) =>
  json(403, { message }, origin);
export const notFound = (message = 'Not found', origin?: string) =>
  json(404, { message }, origin);
export const conflict = (message: string, origin?: string) =>
  json(409, { message }, origin);
export const serverError = (message = 'Internal server error', origin?: string) =>
  json(500, { message }, origin);

// Preflight OPTIONS response.
export const preflight = (origin?: string): APIGatewayProxyStructuredResultV2 => ({
  statusCode: 204,
  headers: corsHeaders(origin),
  body: '',
});
