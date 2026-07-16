// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — Pulari Restaurant
// Connects to AWS API Gateway → Lambda functions
// All public methods are typed. Backend not yet deployed — methods return
// mock data in dev so the frontend builds and runs end-to-end today.
// Replace VITE_API_BASE_URL in .env to point at the real API Gateway endpoint.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ApiResponse,
  PaginatedResponse,
  MenuItem,
  MenuCategory,
  Order,
  CreateOrderPayload,
  CreatePaymentIntentPayload,
  PaymentIntent,
  Reservation,
  Review,
  BlogPost,
  SpecialOffer,
  Coupon,
  AnalyticsSummary,
  RestaurantSettings,
  User,
} from '../types';
import {
  createItem as mockCreateItem,
  createOffer as mockCreateOffer,
  deleteItem as mockDeleteItem,
  deleteOffer as mockDeleteOffer,
  getAnalyticsSummary as mockGetAnalyticsSummary,
  getSettings as mockGetSettings,
  listCategories as mockListCategories,
  listItems as mockListItems,
  listOffers as mockListOffers,
  listOrders as mockListOrders,
  listPosts as mockListPosts,
  listReservations as mockListReservations,
  createPost as mockCreatePost,
  updatePost as mockUpdatePost,
  deletePost as mockDeletePost,
  updateItem as mockUpdateItem,
  updateOffer as mockUpdateOffer,
  updateOrderStatus as mockUpdateOrderStatus,
  updateReservationStatus as mockUpdateReservationStatus,
  updateSettings as mockUpdateSettings,
} from '../admin/data/mockAdminStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const IS_MOCK = !API_BASE;

// True when a real backend (API Gateway) is configured. Payments + live order
// placement require this; in mock mode the checkout offers fallback options.
export const isApiConfigured = (): boolean => !IS_MOCK;

// ─── FETCH HELPER ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Attach Cognito JWT if available
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session?.tokens?.idToken?.toString();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // unauthenticated request — fine for public endpoints
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      return { data: null, error: data.message ?? 'Request failed', status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    return { data: null, error: (err as Error).message, status: 0 };
  }
}

// ─── MENU ─────────────────────────────────────────────────────────────────────

export const menuApi = {
  async getCategories(): Promise<ApiResponse<MenuCategory[]>> {
    if (IS_MOCK) return { data: mockListCategories(), error: null, status: 200 };
    return request<MenuCategory[]>('/menu/categories');
  },

  async getItems(categoryId?: string): Promise<ApiResponse<MenuItem[]>> {
    if (IS_MOCK) return { data: mockListItems(categoryId), error: null, status: 200 };
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return request<MenuItem[]>(`/menu/items${qs}`);
  },

  async getItem(id: string): Promise<ApiResponse<MenuItem>> {
    if (IS_MOCK) {
      const found = mockListItems().find((item) => item.id === id) ?? null;
      return { data: found, error: found ? null : 'Item not found', status: found ? 200 : 404 };
    }
    return request<MenuItem>(`/menu/items/${id}`);
  },

  // Admin only
  async createItem(item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MenuItem>> {
    if (IS_MOCK) return { data: mockCreateItem(item), error: null, status: 201 };
    return request<MenuItem>('/admin/menu/items', { method: 'POST', body: JSON.stringify(item) });
  },

  async updateItem(id: string, item: Partial<MenuItem>): Promise<ApiResponse<MenuItem>> {
    if (IS_MOCK) {
      const updated = mockUpdateItem(id, item);
      return { data: updated, error: updated ? null : 'Item not found', status: updated ? 200 : 404 };
    }
    return request<MenuItem>(`/admin/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(item) });
  },

  async deleteItem(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK) {
      mockDeleteItem(id);
      return { data: null, error: null, status: 204 };
    }
    return request<void>(`/admin/menu/items/${id}`, { method: 'DELETE' });
  },
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  async create(payload: CreateOrderPayload): Promise<ApiResponse<Order>> {
    return request<Order>('/orders', { method: 'POST', body: JSON.stringify(payload) });
  },

  async getById(orderId: string): Promise<ApiResponse<Order>> {
    return request<Order>(`/orders/${orderId}`);
  },

  async getMyOrders(): Promise<ApiResponse<PaginatedResponse<Order>>> {
    return request<PaginatedResponse<Order>>('/orders/my');
  },

  // Admin only
  async list(params?: {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Order>>> {
    if (IS_MOCK) {
      const items = mockListOrders(params?.status);
      return {
        data: {
          items,
          total: items.length,
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? items.length,
          hasMore: false,
        },
        error: null,
        status: 200,
      };
    }
    const qs = new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<PaginatedResponse<Order>>(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  async updateStatus(orderId: string, status: Order['status']): Promise<ApiResponse<Order>> {
    if (IS_MOCK) {
      const updated = mockUpdateOrderStatus(orderId, status);
      return { data: updated, error: updated ? null : 'Order not found', status: updated ? 200 : 404 };
    }
    return request<Order>(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  async createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<ApiResponse<PaymentIntent>> {
    return request<PaymentIntent>('/payments/intent', { method: 'POST', body: JSON.stringify(payload) });
  },

  async confirmPayment(paymentIntentId: string): Promise<ApiResponse<PaymentIntent>> {
    return request<PaymentIntent>(`/payments/${paymentIntentId}/confirm`, { method: 'POST' });
  },

  // Admin only
  async refund(paymentIntentId: string, amount: number, reason: string): Promise<ApiResponse<void>> {
    return request<void>(`/admin/payments/${paymentIntentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
};

// ─── COUPONS ──────────────────────────────────────────────────────────────────

export const couponsApi = {
  async validate(code: string, orderAmount: number): Promise<ApiResponse<Coupon>> {
    return request<Coupon>('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount }),
    });
  },

  // Admin only
  async list(): Promise<ApiResponse<Coupon[]>> {
    return request<Coupon[]>('/admin/coupons');
  },

  async create(coupon: Omit<Coupon, 'id' | 'currentUses' | 'createdAt'>): Promise<ApiResponse<Coupon>> {
    return request<Coupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(coupon) });
  },

  async toggle(id: string, isActive: boolean): Promise<ApiResponse<Coupon>> {
    return request<Coupon>(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
};

// ─── OFFERS ───────────────────────────────────────────────────────────────────

export const offersApi = {
  async getActive(): Promise<ApiResponse<SpecialOffer[]>> {
    if (IS_MOCK) {
      const active = mockListOffers().filter((offer) => offer.isActive);
      return { data: active, error: null, status: 200 };
    }
    return request<SpecialOffer[]>('/offers');
  },

  // Admin only
  async list(): Promise<ApiResponse<SpecialOffer[]>> {
    if (IS_MOCK) return { data: mockListOffers(), error: null, status: 200 };
    return request<SpecialOffer[]>('/admin/offers');
  },

  async create(offer: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<SpecialOffer>> {
    if (IS_MOCK) return { data: mockCreateOffer(offer), error: null, status: 201 };
    return request<SpecialOffer>('/admin/offers', { method: 'POST', body: JSON.stringify(offer) });
  },

  async update(id: string, offer: Partial<SpecialOffer>): Promise<ApiResponse<SpecialOffer>> {
    if (IS_MOCK) {
      const updated = mockUpdateOffer(id, offer);
      return { data: updated, error: updated ? null : 'Offer not found', status: updated ? 200 : 404 };
    }
    return request<SpecialOffer>(`/admin/offers/${id}`, { method: 'PUT', body: JSON.stringify(offer) });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK) {
      mockDeleteOffer(id);
      return { data: null, error: null, status: 204 };
    }
    return request<void>(`/admin/offers/${id}`, { method: 'DELETE' });
  },
};

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export const reservationsApi = {
  async create(reservation: Omit<Reservation, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Reservation>> {
    return request<Reservation>('/reservations', { method: 'POST', body: JSON.stringify(reservation) });
  },

  async getById(id: string): Promise<ApiResponse<Reservation>> {
    return request<Reservation>(`/reservations/${id}`);
  },

  // Admin only
  async list(params?: { date?: string; status?: string }): Promise<ApiResponse<PaginatedResponse<Reservation>>> {
    if (IS_MOCK) {
      const items = mockListReservations(params?.status as Reservation['status'] | undefined);
      return { data: { items, total: items.length, page: 1, pageSize: items.length, hasMore: false }, error: null, status: 200 };
    }
    const qs = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v !== undefined) as [string, string][]).toString();
    return request<PaginatedResponse<Reservation>>(`/admin/reservations${qs ? `?${qs}` : ''}`);
  },

  async updateStatus(id: string, status: Reservation['status']): Promise<ApiResponse<Reservation>> {
    if (IS_MOCK) {
      const updated = mockUpdateReservationStatus(id, status);
      return { data: updated, error: updated ? null : 'Reservation not found', status: updated ? 200 : 404 };
    }
    return request<Reservation>(`/admin/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ─── BLOG ─────────────────────────────────────────────────────────────────────

export const blogApi = {
  async list(params?: { page?: number; pageSize?: number; categoryId?: string }): Promise<ApiResponse<PaginatedResponse<BlogPost>>> {
    if (IS_MOCK) {
      const items = mockListPosts();
      return { data: { items, total: items.length, page: 1, pageSize: items.length, hasMore: false }, error: null, status: 200 };
    }
    const qs = new URLSearchParams(Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString();
    return request<PaginatedResponse<BlogPost>>(`/blog${qs ? `?${qs}` : ''}`);
  },

  async getBySlug(slug: string): Promise<ApiResponse<BlogPost>> {
    if (IS_MOCK) {
      const found = mockListPosts().find((p) => p.slug === slug) ?? null;
      return { data: found, error: null, status: 200 };
    }
    return request<BlogPost>(`/blog/${slug}`);
  },

  // Admin only
  async create(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BlogPost>> {
    if (IS_MOCK) return { data: mockCreatePost(post), error: null, status: 201 };
    return request<BlogPost>('/admin/blog', { method: 'POST', body: JSON.stringify(post) });
  },

  async update(id: string, post: Partial<BlogPost>): Promise<ApiResponse<BlogPost>> {
    if (IS_MOCK) {
      const updated = mockUpdatePost(id, post);
      return { data: updated, error: updated ? null : 'Post not found', status: updated ? 200 : 404 };
    }
    return request<BlogPost>(`/admin/blog/${id}`, { method: 'PUT', body: JSON.stringify(post) });
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    if (IS_MOCK) {
      mockDeletePost(id);
      return { data: null, error: null, status: 204 };
    }
    return request<void>(`/admin/blog/${id}`, { method: 'DELETE' });
  },

  async publish(id: string): Promise<ApiResponse<BlogPost>> {
    if (IS_MOCK) {
      const updated = mockUpdatePost(id, { status: 'published', publishedAt: new Date().toISOString() });
      return { data: updated, error: updated ? null : 'Post not found', status: updated ? 200 : 404 };
    }
    return request<BlogPost>(`/admin/blog/${id}/publish`, { method: 'PATCH' });
  },
};

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  async getApproved(): Promise<ApiResponse<Review[]>> {
    if (IS_MOCK) return { data: [], error: null, status: 200 };
    return request<Review[]>('/reviews');
  },

  async submit(review: Pick<Review, 'customerName' | 'rating' | 'comment' | 'orderId'>): Promise<ApiResponse<Review>> {
    return request<Review>('/reviews', { method: 'POST', body: JSON.stringify(review) });
  },

  // Admin only
  async list(): Promise<ApiResponse<Review[]>> {
    return request<Review[]>('/admin/reviews');
  },

  async approve(id: string): Promise<ApiResponse<Review>> {
    return request<Review>(`/admin/reviews/${id}/approve`, { method: 'PATCH' });
  },
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  async get(): Promise<ApiResponse<RestaurantSettings>> {
    if (IS_MOCK) return { data: mockGetSettings(), error: null, status: 200 };
    return request<RestaurantSettings>('/settings');
  },

  // Admin only
  async update(settings: Partial<RestaurantSettings>): Promise<ApiResponse<RestaurantSettings>> {
    if (IS_MOCK) return { data: mockUpdateSettings(settings), error: null, status: 200 };
    return request<RestaurantSettings>('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
  },
};

// ─── USERS (ADMIN) ────────────────────────────────────────────────────────────

export const usersApi = {
  async getMe(): Promise<ApiResponse<User>> {
    return request<User>('/users/me');
  },

  async updateMe(updates: Partial<Pick<User, 'fullName' | 'phone'>>): Promise<ApiResponse<User>> {
    return request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(updates) });
  },

  // Admin only
  async list(): Promise<ApiResponse<PaginatedResponse<User>>> {
    return request<PaginatedResponse<User>>('/admin/users');
  },
};

// ─── UPLOADS (ADMIN) ────────────────────────────────────────────────────────
// Flow: presign() → browser PUT → publicUrl saved as imageUrl in DynamoDB.

export const uploadsApi = {
  /** Request a pre-signed S3 PUT URL. Returns the URL to PUT to and the
   *  permanent public URL to store as imageUrl. */
  async presign(
    filename: string,
    contentType: string
  ): Promise<ApiResponse<{ uploadUrl: string; publicUrl: string }>> {
    if (IS_MOCK)
      return { data: { uploadUrl: '', publicUrl: '' }, error: null, status: 200 };
    return request<{ uploadUrl: string; publicUrl: string }>(
      '/admin/uploads/presign',
      { method: 'POST', body: JSON.stringify({ filename, contentType }) }
    );
  },

  /** PUT the file bytes directly to S3 using the pre-signed URL.
   *  No auth header — the signature is embedded in the URL. */
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  },
};

// ─── ANALYTICS (ADMIN) ────────────────────────────────────────────────────────

export const analyticsApi = {
  async getSummary(): Promise<ApiResponse<AnalyticsSummary>> {
    if (IS_MOCK) return { data: mockGetAnalyticsSummary(), error: null, status: 200 };
    return request<AnalyticsSummary>('/admin/analytics/summary');
  },
};
