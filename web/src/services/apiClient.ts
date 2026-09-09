import { Product, ProductFilter, UserSession, UserProfile, Order, PaymentMethodOption, PaymentTransaction, ProcessPaymentPayload, UserAddress, RegisterPayload, LoginCredentials, CartItem, OrderStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const buildApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${cleanPath}`;
};

export const normalizeProduct = (payload: any): Product => ({
  id: payload.id,
  title: payload.name ?? payload.title,
  description: payload.description ?? '',
  price: Number(payload.price ?? 0),
  compareAtPrice: payload.compareAtPrice,
  category: payload.category ?? 'General',
  imageUrl: payload.imageUrl ?? payload.image ?? 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=800&q=80',
  rating: payload.rating ?? 4.8,
  reviewsCount: payload.reviewsCount ?? 0,
  stock: Number(payload.stock ?? 0),
  sku: payload.sku ?? payload.id ?? 'GEN-000',
  isFeatured: payload.isFeatured,
  tags: payload.tags ?? [],
});

export const normalizeAuthUser = (payload: any): UserSession => ({
  id: payload.id,
  email: payload.email,
  name: `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim() || payload.email,
  role: 'customer',
  token: payload.accessToken ?? payload.token ?? '',
  avatarUrl: payload.avatarUrl ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
});

export const authFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('monolith_ecommerce_session') ? JSON.parse(localStorage.getItem('monolith_ecommerce_session') ?? '{}').token : null;
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || `HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
};

export const serializeImage = (imageUrl?: string) => imageUrl ?? 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=800&q=80';
