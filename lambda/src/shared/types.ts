// ─────────────────────────────────────────────────────────────────────────────
// SHARED DOMAIN TYPES — mirror of src/types/index.ts (backend copy)
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type OrderType = 'collection' | 'dine_in' | 'delivery';
export type OfferType = 'percentage' | 'fixed' | 'bundle';
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  price: number;
  imageUrl: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  allergens?: string[];
  spiceLevel?: 0 | 1 | 2 | 3;
  calories?: number;
  preparationTimeMinutes?: number;
  displayOrder: number;
  // DynamoDB GSI projection helpers
  category?: string;
  categoryName?: string;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userEmail: string; // GSI partition key (lowercased email)
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
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

export interface Reservation {
  id: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userEmail: string; // GSI partition key
  date: string;
  time: string;
  reservationDate: string; // GSI key (mirror of date)
  reservationTime: string; // GSI key (mirror of time)
  guests: number;
  status: ReservationStatus;
  notes?: string;
  tableNumber?: number;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  customerId?: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  isApproved: boolean;
  isHighlighted: boolean;
  orderId?: string;
  menuItemId: string; // GSI key — 'general' when not item-specific
  status: 'pending' | 'approved' | 'rejected'; // GSI key
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: OfferType;
  value: number;
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

export interface SpecialOffer {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  price?: string;
  badge?: string;
  color?: string;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // markdown
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  categoryId: string;
  authorName: string;
  authorId?: string;
  status: BlogPostStatus;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
