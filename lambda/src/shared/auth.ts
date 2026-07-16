// ─────────────────────────────────────────────────────────────────────────────
// AUTH — Cognito JWT verification + admin group enforcement
// Even though API Gateway has a JWT authorizer, we re-verify the token in-Lambda
// as defence-in-depth and to extract claims (sub, email, groups) reliably.
// ─────────────────────────────────────────────────────────────────────────────
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';
const CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? '';
const ADMIN_GROUP = process.env.ADMIN_GROUP ?? 'admins';

// Verifier is created once per cold start and caches the JWKS.
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: CLIENT_ID,
});

export interface AuthContext {
  sub: string;
  email: string;
  groups: string[];
  isAdmin: boolean;
}

export class AuthError extends Error {
  constructor(
    public statusCode: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function extractBearer(event: APIGatewayProxyEventV2): string | null {
  const header =
    event.headers?.authorization ?? event.headers?.Authorization ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

// Verifies the token and returns the auth context. Throws AuthError(401) if invalid.
export async function authenticate(
  event: APIGatewayProxyEventV2
): Promise<AuthContext> {
  const token = extractBearer(event);
  if (!token) throw new AuthError(401, 'Missing bearer token');

  try {
    const payload = await verifier.verify(token);
    const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
    return {
      sub: payload.sub,
      email: (payload.email as string) ?? '',
      groups,
      isAdmin: groups.includes(ADMIN_GROUP),
    };
  } catch (err) {
    throw new AuthError(401, `Invalid token: ${(err as Error).message}`);
  }
}

// Verifies the token AND enforces admin group membership.
// Throws AuthError(401) if not authenticated, AuthError(403) if not an admin.
export async function requireAdmin(
  event: APIGatewayProxyEventV2
): Promise<AuthContext> {
  const auth = await authenticate(event);
  if (!auth.isAdmin) {
    throw new AuthError(403, 'Admin privileges required');
  }
  return auth;
}

// Optional auth — returns context if a valid token is present, else null.
// Never throws. Used by public endpoints that personalise when logged in.
export async function optionalAuth(
  event: APIGatewayProxyEventV2
): Promise<AuthContext | null> {
  try {
    return await authenticate(event);
  } catch {
    return null;
  }
}
