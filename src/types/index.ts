// ─────────────────────────────────────────────────────────────────────────────
// PULARI RESTAURANT — SHARED TYPE SYSTEM
// Architecture: React SPA (Vite) → API Gateway → AWS Lambda → DynamoDB
//               Payments: Stripe  |  Auth: AWS Cognito  |  CDN: CloudFront/S3
// ─────────────────────────────────────────────────────────────────────────────

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'        // just placed, awaiting payment
  | 'paid'           // payment confirmed
  | 'confirmed'      // kitchen acknowledged
  | 'preparing'      // being prepared
  | 'ready'          // ready for collection/pickup
  | 'completed'      // handed over
  | 'cancelled'      // cancelled by customer or admin
  | 'refunded';      // refunded after payment

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type OrderType = 'collection' | 'dine_in' | 'delivery'; // delivery for future use

export type UserRole = 'customer' | 'admin' | 'manager' | 'editor';

export type OfferType = 'percentage' | 'fixed' | 'bundle';

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';

// ─── USER & AUTH ─────────────────────────────────────────────────────────────

export interface User {
  id: string;                    // Cognito sub
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;             // ISO 8601
  lastLoginAt?: string;
  isEmailVerified: boolean;
  addresses?: Address[];
}

export interface Address {
  id: string;
  userId: string;
  label?: string;                // e.g. "Home", "Work"
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode?: string;
  country: string;               // default "IE"
  isDefault: boolean;
}

// ─── MENU ─────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;      // for SEO category pages
  price: number;                 // in EUR, e.g. 12.99
  imageUrl: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  allergens?: string[];
  spiceLevel?: 0 | 1 | 2 | 3;   // 0 = none, 3 = very hot
  calories?: number;
  preparationTimeMinutes?: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── CART ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  quantity: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
  couponDiscount?: number;
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;                  // snapshot at time of order
  price: number;                 // snapshot at time of order
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;           // human-readable, e.g. PUL-20260621-0042
  customerId?: string;           // null for guest orders
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;      // Stripe PaymentIntent ID
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  serviceCharge: number;
  total: number;
  couponCode?: string;
  notes?: string;
  estimatedReadyAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  id: string;                    // Stripe PaymentIntent ID (pi_...)
  orderId: string;
  amount: number;                // in cents, e.g. 1299 for €12.99
  currency: string;              // 'eur'
  status: PaymentStatus;
  clientSecret?: string;         // returned to frontend to complete payment
  stripeCustomerId?: string;
  receiptUrl?: string;
  refundedAmount?: number;
  createdAt: string;
}

export interface Refund {
  id: string;
  paymentIntentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
  createdBy: string;             // admin userId
}

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;                  // uppercase, e.g. WELCOME10
  type: OfferType;
  value: number;                 // percentage (10) or fixed (€5)
  minOrderAmount?: number;
  maxUsesTotal?: number;
  maxUsesPerCustomer?: number;
  currentUses: number;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// ─── OFFERS / PROMOTIONS ──────────────────────────────────────────────────────

export interface SpecialOffer {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  price?: string;                // display price, e.g. "€12.99"
  badge?: string;
  color?: string;                // tailwind gradient class
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export interface Reservation {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;                  // YYYY-MM-DD
  time: string;                  // HH:MM
  guests: number;
  status: ReservationStatus;
  notes?: string;
  tableNumber?: number;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  customerId?: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  isApproved: boolean;
  isHighlighted: boolean;
  orderId?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;               // markdown
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  categoryId: string;
  category?: BlogCategory;
  authorName: string;
  authorId?: string;
  status: BlogPostStatus;
  metaTitle?: string;            // SEO override
  metaDescription?: string;     // SEO override
  tags: string[];
  readingTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── SETTINGS / CONFIG ────────────────────────────────────────────────────────

export interface RestaurantSettings {
  name: string;
  tagline: string;
  address: {
    line1: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };
  phone: string;
  email: string;
  whatsapp: string;
  website: string;
  openingHours: OpeningHours[];
  socialLinks: SocialLinks;
  stripePublishableKey: string;
  pinpointAppId?: string;          // AWS Pinpoint App ID for analytics
  enableOnlineOrdering: boolean;
  enableReservations: boolean;
  enableDelivery: boolean;       // future use
  minimumOrderAmount?: number;
  serviceChargePercent: number;
  taxPercent: number;
}

export interface OpeningHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  isOpen: boolean;
  openTime?: string;             // HH:MM
  closeTime?: string;            // HH:MM
  notes?: string;                // e.g. "Closed Tuesdays"
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  tripadvisor?: string;
}

// ─── API LAYER ────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  type: OrderType;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  couponCode?: string;
  notes?: string;
}

export interface CreatePaymentIntentPayload {
  orderId: string;
  customerEmail: string;
}

export interface AnalyticsSummary {
  totalOrdersToday: number;
  totalRevenueToday: number;
  totalOrdersThisWeek: number;
  totalRevenueThisWeek: number;
  totalOrdersThisMonth: number;
  totalRevenueThisMonth: number;
  averageOrderValue: number;
  popularItems: Array<{ itemId: string; name: string; count: number }>;
  recentOrders: Order[];
}
