// ─────────────────────────────────────────────────────────────────────────────
// UPLOADS HANDLER
//   POST /admin/uploads/presign   (admin)
//
// Generates a pre-signed S3 PUT URL so the browser can upload an image
// directly to S3 without routing the binary through Lambda.
//
// Request body: { filename: string, contentType: string }
// Response:     { uploadUrl: string, publicUrl: string }
//
// The browser then:
//   1. PUTs the file to uploadUrl (expires in 5 min, no auth header needed)
//   2. Saves publicUrl as the item's imageUrl in DynamoDB
// ─────────────────────────────────────────────────────────────────────────────
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireAdmin } from '../shared/auth.js';
import { badRequest, ok } from '../shared/response.js';
import { createRouter } from '../shared/router.js';
import { newId } from '../shared/ids.js';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';
const BUCKET = process.env.MEDIA_BUCKET ?? 'pulari-media';
const CDN_BASE = process.env.MEDIA_CDN_BASE ?? `https://${BUCKET}.s3.${REGION}.amazonaws.com`;

const s3 = new S3Client({ region: REGION });

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

async function presign(event: APIGatewayProxyEventV2, origin?: string) {
  await requireAdmin(event);

  let body: { filename?: string; contentType?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return badRequest('Invalid JSON body', origin);
  }

  const { filename, contentType } = body;
  if (!filename || !contentType) {
    return badRequest('filename and contentType are required', origin);
  }
  if (!ALLOWED_TYPES.has(contentType.toLowerCase())) {
    return badRequest('Only JPEG, PNG, WebP and GIF images are allowed', origin);
  }

  // Build a unique, safe key: menu/<uuid>.<ext>
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const key = `menu/${newId()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // Enforce max 8 MB via content-length-range in a bucket policy; we just
    // limit by signed URL expiry (5 min) — sufficient for a low-traffic admin.
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl = `${CDN_BASE}/${key}`;

  return ok({ uploadUrl, publicUrl }, origin);
}

export const handler = createRouter({
  'POST /admin/uploads/presign': presign,
});
