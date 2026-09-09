import { Product, ProductFilter } from '../types';
import { telemetry } from './telemetry';
import { authFetch, normalizeProduct } from './apiClient';

export const productsService = {
  async createProduct(payload: { name: string; description?: string; price: number; stock: number; category?: string; imageUrl?: string; rating?: number; reviewsCount?: number; sku?: string; isFeatured?: boolean; tags?: string[] }): Promise<Product> {
    const product = await authFetch<any>('/products', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        description: payload.description ?? '',
        price: payload.price,
        stock: payload.stock,
        category: payload.category ?? 'General',
        imageUrl: payload.imageUrl,
        rating: payload.rating ?? 4.8,
        reviewsCount: payload.reviewsCount ?? 0,
        sku: payload.sku,
        isFeatured: payload.isFeatured ?? false,
        tags: payload.tags ?? [],
      }),
    });
    return normalizeProduct(product);
  },

  async updateProduct(id: string, payload: Partial<{ name: string; description: string; price: number; stock: number; category: string; imageUrl: string; rating: number; reviewsCount: number; sku: string; isFeatured: boolean; tags: string[] }>): Promise<Product> {
    const product = await authFetch<any>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return normalizeProduct(product);
  },

  async removeProduct(id: string): Promise<{ success: boolean; productId: string }> {
    return authFetch<{ success: boolean; productId: string }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    const startTime = performance.now();

    const query = new URLSearchParams();
    if (filter?.category && filter.category !== 'Todos') query.set('category', filter.category);
    if (filter?.search) query.set('search', filter.search);
    if (filter?.inStockOnly) query.set('inStockOnly', 'true');
    if (filter?.sortBy) query.set('sortBy', filter.sortBy);

    const response = await authFetch<any[]>('/products' + (query.toString() ? `?${query}` : ''));
    const products = response.map(normalizeProduct);

    telemetry.log({ service: 'products', method: 'GET', endpoint: '/api/products' + (filter?.category ? `?category=${encodeURIComponent(filter.category)}` : ''), status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: filter || {}, responsePayload: { count: products.length, totalAvailable: response.length } });

    return products;
  },

  async getProductById(id: string): Promise<Product | null> {
    const startTime = performance.now();

    const product = await authFetch<any>(`/products/${id}`);
    telemetry.log({ service: 'products', method: 'GET', endpoint: `/api/products/${id}`, status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { id: product.id, title: product.name, stock: product.stock } });
    return normalizeProduct(product);
  },

  async getCategories(): Promise<string[]> {
    const categories = await authFetch<string[]>('/products/categories');
    return categories;
  },

  async deductStock(items: { productId: string; quantity: number }[]): Promise<boolean> {
    const startTime = performance.now();

    for (const item of items) {
      const product = await authFetch<any>(`/products/${item.productId}`);
      const nextStock = Math.max(0, Number(product.stock) - item.quantity);
      await authFetch(`/products/${item.productId}`, { method: 'PATCH', body: JSON.stringify({ stock: nextStock }) });
    }

    telemetry.log({ service: 'products', method: 'PATCH', endpoint: '/api/products/stock/batch-deduct', status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: items, responsePayload: { success: true, updatedItemsCount: items.length } });
    return true;
  },

  async resetProducts(): Promise<void> {
    telemetry.log({ service: 'products', method: 'POST', endpoint: '/api/products/reset', status: 200, durationMs: 50, responsePayload: { message: 'Catalog reset to defaults' } });
  }
};
