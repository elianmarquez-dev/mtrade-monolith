import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApiUrl, normalizeProduct } from './apiClient';
import { authService } from './authService';

describe('apiClient adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the backend endpoint from a relative path', () => {
    expect(buildApiUrl('/products')).toContain('/api/products');
  });

  it('normalizes backend product payload into frontend product shape', () => {
    expect(normalizeProduct({
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
    } as any)).toMatchObject({
      id: 'prod-1',
      title: 'Auriculares',
      imageUrl: 'https://example.com/photo.jpg',
      category: 'Audio',
      stock: 10,
      price: 49.99,
    });
  });

  it('serializes register payload using firstName and lastName for the backend DTO contract', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const store = new Map<string, string>();

    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
      configurable: true,
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          accessToken: 'token-abc',
          user: { id: 'usr-1', email: 'ana@example.com', firstName: 'Ana', lastName: 'Lopez' },
        }),
        text: async () => '',
      } as Response;
    }));

    await authService.register({
      email: 'ana@example.com',
      password: 'secret123',
      firstName: 'Ana',
      lastName: 'Lopez',
    } as any);

    const requestBody = JSON.parse(String(calls[0]?.init?.body ?? '{}'));
    expect(requestBody).toMatchObject({
      email: 'ana@example.com',
      password: 'secret123',
      firstName: 'Ana',
      lastName: 'Lopez',
    });
    expect(requestBody).not.toHaveProperty('name');
    expect(requestBody).not.toHaveProperty('phone');
  });
});
