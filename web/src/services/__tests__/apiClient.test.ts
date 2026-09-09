import { describe, expect, it } from 'vitest';
import { buildApiUrl, normalizeProduct } from '../apiClient';

describe('apiClient adapter', () => {
  it('builds the backend endpoint from a relative path', () => {
    expect(buildApiUrl('/products')).toContain('/api/products');
  });

  it('normalizes backend product payload into frontend product shape', () => {
    const product = normalizeProduct({
      id: 'prod-1',
      name: 'Auriculares',
      description: 'Muy buenos',
      price: 49.99,
      stock: 10,
      imageUrl: 'https://example.com/photo.jpg',
      category: 'Audio',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(product).toMatchObject({
      id: 'prod-1',
      title: 'Auriculares',
      imageUrl: 'https://example.com/photo.jpg',
      category: 'Audio',
      stock: 10,
      price: 49.99,
    });
  });
});
