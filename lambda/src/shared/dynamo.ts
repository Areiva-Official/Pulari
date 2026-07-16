// ─────────────────────────────────────────────────────────────────────────────
// DYNAMODB — single shared Document client + table name registry
// ─────────────────────────────────────────────────────────────────────────────
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION ?? 'eu-west-1';

const baseClient = new DynamoDBClient({ region: REGION });

export const ddb = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const TABLES = {
  menu: process.env.TABLE_MENU ?? 'pulari-menu',
  orders: process.env.TABLE_ORDERS ?? 'pulari-orders',
  reservations: process.env.TABLE_RESERVATIONS ?? 'pulari-reservations',
  reviews: process.env.TABLE_REVIEWS ?? 'pulari-reviews',
  coupons: process.env.TABLE_COUPONS ?? 'pulari-coupons',
  settings: process.env.TABLE_SETTINGS ?? 'pulari-settings',
  blog: process.env.TABLE_BLOG ?? 'pulari-blog',
  audit: process.env.TABLE_AUDIT ?? 'pulari-audit',
} as const;
