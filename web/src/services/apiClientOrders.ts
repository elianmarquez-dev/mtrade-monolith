import { Order, PaymentTransaction, CreateOrderPayload, UserAddress, Product, PaymentMethodType } from '../types';
import { authFetch, normalizeProduct, serializeImage } from './apiClient';

export const ordersApi = {
  async createOrder(payload: CreateOrderPayload & { idempotencyKey?: string }): Promise<Order> {
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

    return {
      id: response.id,
      userId: response.userId,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      items: response.items.map((it: any) => ({
        productId: it.productId,
        title: it.product?.title ?? 'Producto',
        price: Number(it.unitPrice ?? 0),
        quantity: it.quantity,
        imageUrl: serializeImage(it.imageUrl),
        sku: it.sku ?? it.productId,
      })),
      shippingAddress: payload.shippingAddress,
      subtotal: Number(response.totalAmount ?? 0),
      shippingFee: 0,
      tax: 0,
      total: Number(response.totalAmount ?? 0),
      status: response.status ?? 'PENDING',
      createdAt: response.createdAt,
      trackingNumber: response.trackingNumber,
    } as Order;
  },

  async getOrders(userId?: string): Promise<Order[]> {
    const response = await authFetch<any[]>('/orders');
    return response.map((order) => ({
      id: order.id,
      userId: order.userId,
      customerName: order.customerName ?? 'Cliente',
      customerEmail: order.customerEmail ?? '',
      items: (order.items ?? []).map((it: any) => ({
        productId: it.productId,
        title: it.title ?? 'Producto',
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
      status: order.status ?? 'pending',
      paymentId: order.paymentId,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      trackingNumber: order.trackingNumber,
    }));
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const order = await authFetch<any>(`/orders/${orderId}`);
      return {
        id: order.id,
        userId: order.userId,
        customerName: 'Cliente',
        customerEmail: 'cliente@example.com',
        items: (order.items ?? []).map((it: any) => ({
          productId: it.productId,
          title: it.title ?? 'Producto',
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
        status: order.status ?? 'pending',
        createdAt: order.createdAt,
      } as Order;
    } catch {
      return null;
    }
  },

  async updateOrderStatus(orderId: string, status: string, paymentId?: string, paymentMethod?: string): Promise<Order> {
    const response = await authFetch<any>(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paymentId, paymentMethod }),
    });

    return {
      id: response.id,
      userId: response.userId,
      customerName: 'Cliente',
      customerEmail: 'cliente@example.com',
      items: (response.items ?? []).map((it: any) => ({
        productId: it.productId,
        title: it.title ?? 'Producto',
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
      status: response.status ?? 'pending',
      paymentId,
      paymentMethod,
      createdAt: response.createdAt,
    } as Order;
  }
};
