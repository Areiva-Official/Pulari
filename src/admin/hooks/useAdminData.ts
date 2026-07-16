import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyticsApi, blogApi, menuApi, offersApi, ordersApi, reservationsApi, settingsApi } from '../../lib/api';
import {
  listReviews, updateReview, deleteReview,
  listCoupons, createCoupon, updateCoupon, deleteCoupon,
  listUsers,
} from '../data/mockAdminStore';
import type { AnalyticsSummary, BlogPost, Coupon, MenuCategory, MenuItem, Order, Reservation, RestaurantSettings, Review, SpecialOffer, User } from '../../types';

type AsyncState<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const cache = new Map<string, unknown>();

function getCached<T>(key: string, fallback: T): T {
  return (cache.get(key) as T | undefined) ?? fallback;
}

function setCached<T>(key: string, value: T) {
  cache.set(key, value);
}

export function useDashboardData(): AsyncState<{ summary: AnalyticsSummary | null; orders: Order[] }> {
  const [data, setData] = useState<{ summary: AnalyticsSummary | null; orders: Order[] }>(() => getCached('dashboard', { summary: null, orders: [] as Order[] }));
  const [loading, setLoading] = useState(!cache.has('dashboard'));
  const [error, setError] = useState<string | null>(null);
  const inflight = useRef(false);

  const refresh = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        analyticsApi.getSummary(),
        ordersApi.list({ page: 1, pageSize: 5 }),
      ]);
      if (summaryRes.error) throw new Error(summaryRes.error);
      if (ordersRes.error) throw new Error(ordersRes.error);
      const next = { summary: summaryRes.data, orders: ordersRes.data?.items ?? [] };
      setCached('dashboard', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useMenuAdminData(): AsyncState<{ categories: MenuCategory[]; items: MenuItem[] }> & {
  createItem: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateItem: (id: string, patch: Partial<MenuItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<{ categories: MenuCategory[]; items: MenuItem[] }>(() => getCached('menu-admin', { categories: [] as MenuCategory[], items: [] as MenuItem[] }));
  const [loading, setLoading] = useState(!cache.has('menu-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, itemsRes] = await Promise.all([menuApi.getCategories(), menuApi.getItems()]);
      if (categoriesRes.error) throw new Error(categoriesRes.error);
      if (itemsRes.error) throw new Error(itemsRes.error);
      const next = { categories: categoriesRes.data ?? [], items: itemsRes.data ?? [] };
      setCached('menu-admin', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createItem = useCallback(async (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await menuApi.createItem(item);
    if (response.error || !response.data) {
      setError(response.error ?? 'Failed to create item');
      return false;
    }
    const next = { ...data, items: [...data.items, response.data] };
    setCached('menu-admin', next);
    setData(next);
    return true;
  }, [data]);

  const updateItem = useCallback(async (id: string, patch: Partial<MenuItem>) => {
    const snapshot = data;
    const optimistic = { ...data, items: data.items.map((item) => item.id === id ? { ...item, ...patch } : item) };
    setData(optimistic);
    const response = await menuApi.updateItem(id, patch);
    if (response.error || !response.data) {
      setData(snapshot);
      setError(response.error ?? 'Failed to update item');
      return false;
    }
    const next = { ...snapshot, items: snapshot.items.map((item) => item.id === id ? response.data! : item) };
    setCached('menu-admin', next);
    setData(next);
    return true;
  }, [data]);

  const deleteItem = useCallback(async (id: string) => {
    const snapshot = data;
    const optimistic = { ...data, items: data.items.filter((item) => item.id !== id) };
    setData(optimistic);
    const response = await menuApi.deleteItem(id);
    if (response.error) {
      setData(snapshot);
      setError(response.error);
      return false;
    }
    setCached('menu-admin', optimistic);
    return true;
  }, [data]);

  return { data, loading, error, refresh, createItem, updateItem, deleteItem };
}

export function useOrdersAdminData(): AsyncState<Order[]> & {
  updateStatus: (id: string, status: Order['status']) => Promise<boolean>;
} {
  const [data, setData] = useState<Order[]>(() => getCached('orders-admin', [] as Order[]));
  const [loading, setLoading] = useState(!cache.has('orders-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ordersApi.list({ page: 1, pageSize: 100 });
      if (response.error) throw new Error(response.error);
      const next = response.data?.items ?? [];
      setCached('orders-admin', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateStatus = useCallback(async (id: string, status: Order['status']) => {
    const snapshot = data;
    const optimistic = data.map((order) => (order.id === id || order.orderNumber === id) ? { ...order, status } : order);
    setData(optimistic);
    const response = await ordersApi.updateStatus(id, status);
    if (response.error || !response.data) {
      setData(snapshot);
      setError(response.error ?? 'Failed to update order');
      return false;
    }
    const next = snapshot.map((order) => (order.id === id || order.orderNumber === id) ? response.data! : order);
    setCached('orders-admin', next);
    setData(next);
    return true;
  }, [data]);

  return { data, loading, error, refresh, updateStatus };
}

export function useSettingsAdminData(): AsyncState<RestaurantSettings | null> & {
  save: (patch: Partial<RestaurantSettings>) => Promise<boolean>;
} {
  const [data, setData] = useState<RestaurantSettings | null>(() => getCached('settings-admin', null));
  const [loading, setLoading] = useState(!cache.has('settings-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsApi.get();
      if (response.error) throw new Error(response.error);
      setCached('settings-admin', response.data ?? null);
      setData(response.data ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (patch: Partial<RestaurantSettings>) => {
    const snapshot = data;
    const optimistic = snapshot ? { ...snapshot, ...patch } : null;
    if (optimistic) setData(optimistic);
    const response = await settingsApi.update(patch);
    if (response.error || !response.data) {
      if (snapshot) setData(snapshot);
      setError(response.error ?? 'Failed to save settings');
      return false;
    }
    setCached('settings-admin', response.data);
    setData(response.data);
    return true;
  }, [data]);

  return { data, loading, error, refresh, save };
}

export function formatRelativeTime(value: string) {
  const date = new Date(value);
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function useOrderStats(orders: Order[]) {
  return useMemo(() => {
    const active = orders.filter((order) => ['pending', 'paid', 'confirmed', 'preparing', 'ready'].includes(order.status)).length;
    const completed = orders.filter((order) => order.status === 'completed');
    const revenue = completed.reduce((sum, order) => sum + order.total, 0);
    return {
      totalOrders: orders.length,
      activeOrders: active,
      completedOrders: completed.length,
      revenue: Number(revenue.toFixed(2)),
    };
  }, [orders]);
}

// ─── RESERVATIONS ─────────────────────────────────────────────────────────────

export function useReservationsAdminData(): AsyncState<Reservation[]> & {
  updateStatus: (id: string, status: Reservation['status']) => Promise<boolean>;
} {
  const [data, setData] = useState<Reservation[]>(() => getCached('reservations-admin', [] as Reservation[]));
  const [loading, setLoading] = useState(!cache.has('reservations-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationsApi.list();
      if (response.error) throw new Error(response.error);
      const next = response.data?.items ?? [];
      setCached('reservations-admin', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const updateStatus = useCallback(async (id: string, status: Reservation['status']): Promise<boolean> => {
    const snapshot = data;
    setData(data.map((r) => r.id === id ? { ...r, status } : r));
    const response = await reservationsApi.updateStatus(id, status);
    if (response.error || !response.data) {
      setData(snapshot);
      setError(response.error ?? 'Failed to update reservation');
      return false;
    }
    const next = snapshot.map((r) => r.id === id ? response.data! : r);
    setCached('reservations-admin', next);
    setData(next);
    return true;
  }, [data]);

  return { data, loading, error, refresh, updateStatus };
}

// ─── REVIEWS ─────────────────────────────────────────────────────────────────

export function useReviewsAdminData(): AsyncState<Review[]> & {
  approve: (id: string, approved: boolean) => Promise<boolean>;
  highlight: (id: string, highlighted: boolean) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<Review[]>(() => getCached('reviews-admin', [] as Review[]));
  const [loading, setLoading] = useState(!cache.has('reviews-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = listReviews();
      setCached('reviews-admin', result);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const approve = useCallback(async (id: string, approved: boolean): Promise<boolean> => {
    const result = updateReview(id, { isApproved: approved });
    if (!result) return false;
    setData((prev) => prev.map((r) => r.id === id ? result : r));
    return true;
  }, []);

  const highlight = useCallback(async (id: string, highlighted: boolean): Promise<boolean> => {
    const result = updateReview(id, { isHighlighted: highlighted });
    if (!result) return false;
    setData((prev) => prev.map((r) => r.id === id ? result : r));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    deleteReview(id);
    setData((prev) => prev.filter((r) => r.id !== id));
    return true;
  }, []);

  return { data, loading, error, refresh, approve, highlight, remove };
}

// ─── OFFERS ───────────────────────────────────────────────────────────────────

export function useOffersAdminData(): AsyncState<SpecialOffer[]> & {
  create: (payload: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  update: (id: string, patch: Partial<SpecialOffer>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<SpecialOffer[]>(() => getCached('offers-admin', [] as SpecialOffer[]));
  const [loading, setLoading] = useState(!cache.has('offers-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await offersApi.list();
      if (response.error) throw new Error(response.error);
      const next = response.data ?? [];
      setCached('offers-admin', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (payload: Omit<SpecialOffer, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const response = await offersApi.create(payload);
    if (response.error || !response.data) {
      setError(response.error ?? 'Failed to create offer');
      return false;
    }
    const next = [...data, response.data].sort((a, b) => a.displayOrder - b.displayOrder);
    setCached('offers-admin', next);
    setData(next);
    return true;
  }, [data]);

  const update = useCallback(async (id: string, patch: Partial<SpecialOffer>): Promise<boolean> => {
    const response = await offersApi.update(id, patch);
    if (response.error || !response.data) {
      setError(response.error ?? 'Failed to update offer');
      return false;
    }
    const next = data
      .map((offer) => (offer.id === id ? response.data! : offer))
      .sort((a, b) => a.displayOrder - b.displayOrder);
    setCached('offers-admin', next);
    setData(next);
    return true;
  }, [data]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const response = await offersApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    }
    const next = data.filter((offer) => offer.id !== id);
    setCached('offers-admin', next);
    setData(next);
    return true;
  }, [data]);

  return { data, loading, error, refresh, create, update, remove };
}

// ─── COUPONS ─────────────────────────────────────────────────────────────────

export function useCouponsAdminData(): AsyncState<Coupon[]> & {
  create: (payload: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>) => Promise<boolean>;
  update: (id: string, patch: Partial<Coupon>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<Coupon[]>(() => getCached('coupons-admin', [] as Coupon[]));
  const [loading, setLoading] = useState(!cache.has('coupons-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = listCoupons();
      setCached('coupons-admin', result);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (payload: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>): Promise<boolean> => {
    const result = createCoupon(payload);
    setData((prev) => [result, ...prev]);
    return true;
  }, []);

  const update = useCallback(async (id: string, patch: Partial<Coupon>): Promise<boolean> => {
    const result = updateCoupon(id, patch);
    if (!result) return false;
    setData((prev) => prev.map((c) => c.id === id ? result : c));
    return true;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    deleteCoupon(id);
    setData((prev) => prev.filter((c) => c.id !== id));
    return true;
  }, []);

  return { data, loading, error, refresh, create, update, remove };
}

// ─── USERS ───────────────────────────────────────────────────────────────────

export function useUsersAdminData(): AsyncState<User[]> {
  const [data, setData] = useState<User[]>(() => getCached('users-admin', [] as User[]));
  const [loading, setLoading] = useState(!cache.has('users-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = listUsers();
      setCached('users-admin', result);
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { data, loading, error, refresh };
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────

export function useBlogAdminData(): AsyncState<BlogPost[]> & {
  create: (payload: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  update: (id: string, patch: Partial<BlogPost>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const [data, setData] = useState<BlogPost[]>(() => getCached('blog-admin', [] as BlogPost[]));
  const [loading, setLoading] = useState(!cache.has('blog-admin'));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await blogApi.list({ pageSize: 200 });
      if (response.error) throw new Error(response.error);
      const next = response.data?.items ?? [];
      setCached('blog-admin', next);
      setData(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (payload: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const response = await blogApi.create(payload);
    if (response.error || !response.data) {
      setError(response.error ?? 'Failed to create post');
      return false;
    }
    const next = [response.data, ...data];
    setCached('blog-admin', next);
    setData(next);
    return true;
  }, [data]);

  const update = useCallback(async (id: string, patch: Partial<BlogPost>): Promise<boolean> => {
    const snapshot = data;
    setData(data.map((p) => p.id === id ? { ...p, ...patch } : p));
    const response = await blogApi.update(id, patch);
    if (response.error || !response.data) {
      setData(snapshot);
      setError(response.error ?? 'Failed to update post');
      return false;
    }
    const next = snapshot.map((p) => p.id === id ? response.data! : p);
    setCached('blog-admin', next);
    setData(next);
    return true;
  }, [data]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const response = await blogApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    }
    const next = data.filter((p) => p.id !== id);
    setCached('blog-admin', next);
    setData(next);
    return true;
  }, [data]);

  return { data, loading, error, refresh, create, update, remove };
}

