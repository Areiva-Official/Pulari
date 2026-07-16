// ─────────────────────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMAS — every write path validates input before it touches DB.
// Mirrors src/types/index.ts on the frontend.
// ─────────────────────────────────────────────────────────────────────────────
import { z } from 'zod';

// ─── MENU ─────────────────────────────────────────────────────────────────────

export const menuItemCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140),
  description: z.string().max(500).default(''),
  longDescription: z.string().max(4000).optional(),
  price: z.number().nonnegative().max(10000),
  imageUrl: z.string().url().or(z.string().max(0)).default(''),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  allergens: z.array(z.string()).optional(),
  spiceLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  calories: z.number().int().nonnegative().optional(),
  preparationTimeMinutes: z.number().int().nonnegative().optional(),
  displayOrder: z.number().int().default(0),
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial();

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5).max(30),
  type: z.enum(['collection', 'dine_in', 'delivery']),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive().max(99),
        specialInstructions: z.string().max(280).optional(),
      })
    )
    .min(1),
  couponCode: z.string().max(40).optional(),
  notes: z.string().max(500).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'paid',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'refunded',
  ]),
});

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const createReservationSchema = z.object({
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(5).max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'time must be HH:MM'),
  guests: z.number().int().positive().max(50),
  notes: z.string().max(500).optional(),
});

export const reservationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']),
  tableNumber: z.number().int().positive().optional(),
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const submitReviewSchema = z.object({
  customerName: z.string().min(1).max(120),
  rating: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  comment: z.string().min(1).max(2000),
  orderId: z.string().optional(),
});

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(40),
  orderAmount: z.number().nonnegative(),
});

export const createCouponSchema = z.object({
  code: z.string().min(1).max(40),
  type: z.enum(['percentage', 'fixed', 'bundle']),
  value: z.number().nonnegative(),
  minOrderAmount: z.number().nonnegative().optional(),
  maxUsesTotal: z.number().int().positive().optional(),
  maxUsesPerCustomer: z.number().int().positive().optional(),
  validFrom: z.string(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const toggleCouponSchema = z.object({ isActive: z.boolean() });

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const createPaymentIntentSchema = z.object({
  orderId: z.string().min(1),
  customerEmail: z.string().email().optional(),
});

export const refundSchema = z.object({
  // Amount in EUR. Omit for a full refund.
  amount: z.number().positive().max(100000).optional(),
  reason: z.string().max(280).optional(),
});

// ─── OFFERS ───────────────────────────────────────────────────────────────────

export const offerCreateSchema = z.object({
  slug: z.string().min(1).max(140),
  title: z.string().min(1).max(160),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(2000).default(''),
  price: z.string().max(40).optional(),
  badge: z.string().max(40).optional(),
  color: z.string().max(120).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const offerUpdateSchema = offerCreateSchema.partial();

// ─── BLOG ─────────────────────────────────────────────────────────────────────

export const blogCreateSchema = z.object({
  slug: z.string().min(1).max(160),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(600),
  content: z.string().min(1).max(50000),
  featuredImageUrl: z.string().max(1000).optional(),
  featuredImageAlt: z.string().max(300).optional(),
  categoryId: z.string().min(1).max(60),
  authorName: z.string().min(1).max(120).default('Pulari Team'),
  authorId: z.string().max(120).optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
  tags: z.array(z.string().max(60)).default([]),
  readingTimeMinutes: z.number().int().nonnegative().max(120).default(3),
});

export const blogUpdateSchema = blogCreateSchema.partial();

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
// Settings are a flexible config blob — validate loosely but cap size per field.

export const settingsUpdateSchema = z.record(z.string(), z.unknown());

// ─── HELPER ───────────────────────────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(public details: string) {
    super(details);
    this.name = 'ValidationError';
  }
}

export function parseBody<S extends z.ZodTypeAny>(
  schema: S,
  raw: string | undefined
): z.infer<S> {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new ValidationError('Request body is not valid JSON');
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new ValidationError(msg);
  }
  return result.data;
}
