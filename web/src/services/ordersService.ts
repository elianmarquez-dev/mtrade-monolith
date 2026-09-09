import { CreateOrderPayload, Order, OrderStatus } from '../types';
import { DEMO_USER } from './initialData';
import { telemetry } from './telemetry';
import { authFetch, serializeImage } from './apiClient';

const ORDERS_STORAGE_KEY = 'monolith_ecommerce_orders';

const INITIAL_ORDERS: Order[] = [{
  id: 'ord-8921',
  userId: DEMO_USER.id,
  customerName: DEMO_USER.name,
  customerEmail: DEMO_USER.email,
  items: [{
    productId: 'prod-001',
    title: 'Auriculares Inalámbricos Pro ANC',
    price: 149.99,
    quantity: 1,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    sku: 'AUDIO-ANC-001'
  }],
  shippingAddress: DEMO_USER.addresses[0],
  subtotal: 149.99,
  shippingFee: 0,
  tax: 31.50,
  total: 181.49,
  status: 'delivered',
  paymentId: 'pay-tx-5510',
  paymentMethod: 'Tarjeta de Crédito (Visa •••• 4242)',
  createdAt: '2025-02-10T14:32:00.000Z',
  trackingNumber: 'TRK-ES-9928174'
}];

function getStoredOrders(): Order[] {
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
  return INITIAL_ORDERS;
}

function saveStoredOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
}

export const ordersService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const startTime = performance.now();

    try {
      const body = {
        items: payload.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        totalAmount: payload.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      };

      const response = await authFetch<any>('/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const order = {
        id: response.id,
        userId: response.userId,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        items: response.items.map((it: any) => ({
          productId: it.productId,
          title: it.productTitle ?? it.title ?? 'Producto',
          price: Number(it.unitPrice ?? 0),
          quantity: it.quantity,
          imageUrl: serializeImage(it.imageUrl),
          sku: it.sku ?? it.productId,
        })),
        shippingAddress: payload.shippingAddress,
        subtotal: Number(response.totalAmount ?? body.totalAmount),
        shippingFee: 0,
        tax: 0,
        total: Number(response.totalAmount ?? body.totalAmount),
        status: response.status ?? 'PENDING',
        paymentId: response.paymentId,
        paymentMethod: response.paymentMethod,
        createdAt: response.createdAt,
        trackingNumber: response.trackingNumber,
      } as Order;

      telemetry.log({ service: 'orders', method: 'POST', endpoint: '/api/orders', status: 201, durationMs: Math.round(performance.now() - startTime), requestPayload: { itemsCount: payload.items.length, total: order.total }, responsePayload: { orderId: order.id, status: order.status, total: order.total } });

      return order;
    } catch {
      const subtotal = payload.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const shippingFee = subtotal > 100 ? 0 : 12.0;
      const tax = +(subtotal * 0.21).toFixed(2);
      const total = +(subtotal + shippingFee + tax).toFixed(2);

      const orderNumber = Math.floor(1000 + Math.random() * 9000);
      const newOrder: Order = {
        id: `ord-${orderNumber}`,
        userId: payload.userId,
        customerName: payload.customerName,
        customerEmail: payload.customerEmail,
        items: payload.items.map((it) => ({
          productId: it.product.id,
          title: it.product.title,
          price: it.product.price,
          quantity: it.quantity,
          imageUrl: it.product.imageUrl,
          sku: it.product.sku,
        })),
        shippingAddress: payload.shippingAddress,
        subtotal: +subtotal.toFixed(2),
        shippingFee,
        tax,
        total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const orders = getStoredOrders();
      orders.unshift(newOrder);
      saveStoredOrders(orders);

      telemetry.log({ service: 'orders', method: 'POST', endpoint: '/api/orders', status: 201, durationMs: Math.round(performance.now() - startTime), requestPayload: { userId: payload.userId, itemsCount: payload.items.length, total: newOrder.total }, responsePayload: { orderId: newOrder.id, status: newOrder.status, total: newOrder.total } });
      return newOrder;
    }
  },

  async updateOrder(orderId: string, payload: Partial<{ status: OrderStatus; totalAmount: number; items: { productId: string; quantity: number; unitPrice: number }[] }>): Promise<Order> {
    const response = await authFetch<any>(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return {
      id: response.id,
      userId: response.userId,
      customerName: 'Cliente',
      customerEmail: 'cliente@example.com',
      items: (response.items ?? []).map((it: any) => ({
        productId: it.productId,
        title: it.productTitle ?? it.title ?? 'Producto',
        price: Number(it.unitPrice ?? 0),
        quantity: it.quantity,
        imageUrl: serializeImage(it.imageUrl),
        sku: it.sku ?? it.productId,
      })),
      shippingAddress: { id: 'addr-order', label: 'Entrega', street: 'Backend address', city: 'Madrid', state: 'Madrid', postalCode: '28001', country: 'España', isDefault: true },
      subtotal: Number(response.totalAmount ?? 0),
      shippingFee: 0,
      tax: 0,
      total: Number(response.totalAmount ?? 0),
      status: response.status === 'PENDING' ? 'pending' : response.status,
      paymentId: response.paymentId,
      paymentMethod: response.paymentMethod,
      createdAt: response.createdAt,
      trackingNumber: response.trackingNumber,
    } as Order;
  },

  async removeOrder(orderId: string): Promise<{ success: boolean; orderId: string }> {
    return authFetch<{ success: boolean; orderId: string }>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  },

  async getOrders(userId?: string): Promise<Order[]> {
    const startTime = performance.now();

    try {
      const response = await authFetch<any[]>('/orders');
      const list = response.map((order) => ({
        id: order.id,
        userId: order.userId,
        customerName: 'Cliente',
        customerEmail: 'cliente@example.com',
        items: (order.items ?? []).map((it: any) => ({
          productId: it.productId,
          title: it.productTitle ?? it.title ?? 'Producto',
          price: Number(it.unitPrice ?? 0),
          quantity: it.quantity,
          imageUrl: serializeImage(it.imageUrl),
          sku: it.sku ?? it.productId,
        })),
        shippingAddress: { id: 'addr-order', label: 'Entrega', street: 'Backend address', city: 'Madrid', state: 'Madrid', postalCode: '28001', country: 'España', isDefault: true },
        subtotal: Number(order.totalAmount ?? 0),
        shippingFee: 0,
        tax: 0,
        total: Number(order.totalAmount ?? 0),
        status: order.status === 'PENDING' ? 'pending' : order.status,
        paymentId: order.paymentId,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        trackingNumber: order.trackingNumber,
      } as Order));

      telemetry.log({ service: 'orders', method: 'GET', endpoint: userId ? `/api/orders?userId=${userId}` : '/api/orders', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { count: list.length, totalRecorded: list.length } });
      return list;
    } catch {
      const orders = getStoredOrders();
      const filtered = userId ? orders.filter((o) => o.userId === userId) : orders;
      telemetry.log({ service: 'orders', method: 'GET', endpoint: userId ? `/api/orders?userId=${userId}` : '/api/orders', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { count: filtered.length, totalRecorded: orders.length } });
      return filtered;
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const startTime = performance.now();

    try {
      const order = await authFetch<any>(`/orders/${orderId}`);
      const normalized = {
        id: order.id,
        userId: order.userId,
        customerName: 'Cliente',
        customerEmail: 'cliente@example.com',
        items: (order.items ?? []).map((it: any) => ({
          productId: it.productId,
          title: it.productTitle ?? it.title ?? 'Producto',
          price: Number(it.unitPrice ?? 0),
          quantity: it.quantity,
          imageUrl: serializeImage(it.imageUrl),
          sku: it.sku ?? it.productId,
        })),
        shippingAddress: { id: 'addr-order', label: 'Entrega', street: 'Backend address', city: 'Madrid', state: 'Madrid', postalCode: '28001', country: 'España', isDefault: true },
        subtotal: Number(order.totalAmount ?? 0),
        shippingFee: 0,
        tax: 0,
        total: Number(order.totalAmount ?? 0),
        status: order.status === 'PENDING' ? 'pending' : order.status,
        createdAt: order.createdAt,
      } as Order;

      telemetry.log({ service: 'orders', method: 'GET', endpoint: `/api/orders/${orderId}`, status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { orderId: normalized.id, status: normalized.status, total: normalized.total } });
      return normalized;
    } catch {
      const orders = getStoredOrders();
      const order = orders.find((o) => o.id === orderId) || null;
      telemetry.log({ service: 'orders', method: 'GET', endpoint: `/api/orders/${orderId}`, status: order ? 200 : 404, durationMs: Math.round(performance.now() - startTime), responsePayload: order ? { orderId: order.id, status: order.status, total: order.total } : { error: 'Order not found' } });
      return order;
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, paymentId?: string, paymentMethod?: string): Promise<Order> {
    const startTime = performance.now();

    try {
      const response = await authFetch<any>(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: status.toUpperCase(), paymentId, paymentMethod }),
      });

      const normalized = {
        id: response.id,
        userId: response.userId,
        customerName: 'Cliente',
        customerEmail: 'cliente@example.com',
        items: (response.items ?? []).map((it: any) => ({
          productId: it.productId,
          title: it.productTitle ?? it.title ?? 'Producto',
          price: Number(it.unitPrice ?? 0),
          quantity: it.quantity,
          imageUrl: serializeImage(it.imageUrl),
          sku: it.sku ?? it.productId,
        })),
        shippingAddress: { id: 'addr-order', label: 'Entrega', street: 'Backend address', city: 'Madrid', state: 'Madrid', postalCode: '28001', country: 'España', isDefault: true },
        subtotal: Number(response.totalAmount ?? 0),
        shippingFee: 0,
        tax: 0,
        total: Number(response.totalAmount ?? 0),
        status: response.status === 'PENDING' ? 'pending' : response.status,
        paymentId,
        paymentMethod,
        createdAt: response.createdAt,
      } as Order;

      telemetry.log({ service: 'orders', method: 'PATCH', endpoint: `/api/orders/${orderId}/status`, status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: { status, paymentId, paymentMethod }, responsePayload: { orderId: normalized.id, updatedStatus: normalized.status } });
      return normalized;
    } catch {
      const orders = getStoredOrders();
      const index = orders.findIndex((o) => o.id === orderId);
      if (index === -1) {
        throw new Error(`Order ${orderId} not found`);
      }

      const order = orders[index];
      order.status = status;
      if (paymentId) order.paymentId = paymentId;
      if (paymentMethod) order.paymentMethod = paymentMethod;
      if (status === 'shipped' && !order.trackingNumber) {
        order.trackingNumber = `TRK-ES-${Math.floor(1000000 + Math.random() * 9000000)}`;
      }

      orders[index] = order;
      saveStoredOrders(orders);

      telemetry.log({ service: 'orders', method: 'PATCH', endpoint: `/api/orders/${orderId}/status`, status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: { status, paymentId, paymentMethod }, responsePayload: { orderId: order.id, updatedStatus: order.status } });
      return order;
    }
  }
};
