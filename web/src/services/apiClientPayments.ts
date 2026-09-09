import { PaymentMethodOption, PaymentTransaction, ProcessPaymentPayload } from '../types';
import { authFetch } from './apiClient';

export const paymentsApi = {
  async getPaymentMethods(): Promise<PaymentMethodOption[]> {
    return authFetch('/payments/methods');
  },

  async processPayment(payload: ProcessPaymentPayload): Promise<PaymentTransaction> {
    const response = await authFetch<any>('/payments', {
      method: 'POST',
      body: JSON.stringify({
        orderId: payload.orderId,
        amount: payload.amount,
        provider: payload.method,
      }),
      headers: { 'Idempotency-Key': `checkout-${payload.orderId}-${Date.now()}` },
    });

    return {
      id: response.id,
      orderId: response.orderId,
      amount: Number(response.amount ?? payload.amount),
      currency: 'USD',
      method: payload.method,
      status: response.status === 'SUCCEEDED' ? 'succeeded' : response.status.toLowerCase(),
      authorizationCode: response.providerPaymentId ?? response.id,
      processedAt: response.createdAt,
      lastFour: payload.cardDetails?.cardNumber?.replace(/\s+/g, '').slice(-4),
    } as PaymentTransaction;
  },

  async verifyTransaction(txId: string): Promise<PaymentTransaction | null> {
    try {
      const response = await authFetch<any>(`/payments/${txId}`);
      return {
        id: response.id,
        orderId: response.orderId,
        amount: Number(response.amount),
        currency: 'USD',
        method: response.provider,
        status: response.status === 'SUCCEEDED' ? 'succeeded' : response.status.toLowerCase(),
        authorizationCode: response.providerPaymentId ?? response.id,
        processedAt: response.createdAt,
      } as PaymentTransaction;
    } catch {
      return null;
    }
  }
};
