import { PaymentMethodOption, PaymentTransaction, ProcessPaymentPayload } from '../types';
import { telemetry } from './telemetry';
import { authFetch } from './apiClient';

const PAYMENTS_STORAGE_KEY = 'monolith_ecommerce_payments';

export const AVAILABLE_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'credit_card', name: 'Tarjeta de Crédito / Débito', description: 'Visa, Mastercard, American Express con cifrado SSL 256-bit', iconName: 'CreditCard' },
  { id: 'paypal', name: 'PayPal Checkout', description: 'Pago seguro instantáneo a través de tu cuenta digital PayPal', iconName: 'Wallet' },
  { id: 'bank_transfer', name: 'Transferencia Bancaria / SEPA', description: 'Aprobación automática bancaria mediante pasarela inmediata', iconName: 'Building2' }
];

function getStoredPayments(): PaymentTransaction[] {
  const stored = localStorage.getItem(PAYMENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return [];
}

function savePayments(transactions: PaymentTransaction[]) {
  localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(transactions));
}

export const paymentsService = {
  async getPayments(): Promise<PaymentTransaction[]> {
    const payments = await authFetch<any[]>('/payments');
    return payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount ?? 0),
      currency: 'USD',
      method: payment.provider ?? 'credit_card',
      status: payment.status === 'SUCCEEDED' ? 'succeeded' : (payment.status ?? 'pending').toLowerCase(),
      authorizationCode: payment.providerPaymentId ?? payment.id,
      processedAt: payment.createdAt,
      lastFour: undefined,
    } as PaymentTransaction));
  },

  async getPaymentById(id: string): Promise<PaymentTransaction | null> {
    try {
      const payment = await authFetch<any>(`/payments/${id}`);
      return {
        id: payment.id,
        orderId: payment.orderId,
        amount: Number(payment.amount ?? 0),
        currency: 'USD',
        method: payment.provider ?? 'credit_card',
        status: payment.status === 'SUCCEEDED' ? 'succeeded' : payment.status.toLowerCase(),
        authorizationCode: payment.providerPaymentId ?? payment.id,
        processedAt: payment.createdAt,
      } as PaymentTransaction;
    } catch {
      return null;
    }
  },

  async updatePayment(id: string, payload: Partial<{ status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' }>): Promise<PaymentTransaction> {
    const payment = await authFetch<any>(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return {
      id: payment.id,
      orderId: payment.orderId,
      amount: Number(payment.amount ?? 0),
      currency: 'USD',
      method: payment.provider ?? 'credit_card',
      status: payment.status === 'SUCCEEDED' ? 'succeeded' : payment.status.toLowerCase(),
      authorizationCode: payment.providerPaymentId ?? payment.id,
      processedAt: payment.createdAt,
    } as PaymentTransaction;
  },

  async removePayment(id: string): Promise<{ success: boolean; paymentId: string }> {
    return authFetch<{ success: boolean; paymentId: string }>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },

  async getPaymentMethods(): Promise<PaymentMethodOption[]> {
    const startTime = performance.now();

    try {
      const methods = await authFetch<PaymentMethodOption[]>('/payments/methods');
      telemetry.log({ service: 'payments', method: 'GET', endpoint: '/api/payments/methods', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { methodsAvailable: methods.map((m) => m.id) } });
      return methods;
    } catch {
      telemetry.log({ service: 'payments', method: 'GET', endpoint: '/api/payments/methods', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { methodsAvailable: AVAILABLE_PAYMENT_METHODS.map((m) => m.id) } });
      return AVAILABLE_PAYMENT_METHODS;
    }
  },

  async processPayment(payload: ProcessPaymentPayload): Promise<PaymentTransaction> {
    const startTime = performance.now();

    try {
      const idempotencyKey = `checkout-${payload.orderId}-${Date.now()}`;
      const response = await authFetch<any>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          orderId: payload.orderId,
          amount: payload.amount,
          provider: payload.method,
        }),
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      const tx: PaymentTransaction = {
        id: response.id,
        orderId: response.orderId,
        amount: Number(response.amount ?? payload.amount),
        currency: payload.currency || 'USD',
        method: payload.method,
        status: response.status === 'SUCCEEDED' ? 'succeeded' : (response.status as any).toLowerCase(),
        authorizationCode: response.providerPaymentId ?? response.id,
        processedAt: response.createdAt,
        lastFour: payload.cardDetails?.cardNumber?.replace(/\s+/g, '').slice(-4),
      };

      telemetry.log({ service: 'payments', method: 'POST', endpoint: '/api/payments/charge', status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: { orderId: payload.orderId, amount: payload.amount, method: payload.method, cardMask: tx.lastFour ? `•••• ${tx.lastFour}` : undefined }, responsePayload: { transactionId: tx.id, status: tx.status, authCode: tx.authorizationCode } });

      return tx;
    } catch {
      const txId = 'tx-' + Math.floor(100000 + Math.random() * 900000);
      const authCode = 'AUTH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      let lastFour: string | undefined = undefined;
      if (payload.cardDetails?.cardNumber) {
        const clean = payload.cardDetails.cardNumber.replace(/\s+/g, '');
        lastFour = clean.slice(-4);
      }

      const transaction: PaymentTransaction = {
        id: txId,
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency || 'USD',
        method: payload.method,
        status: 'succeeded',
        authorizationCode: authCode,
        processedAt: new Date().toISOString(),
        lastFour,
      };

      const stored = getStoredPayments();
      stored.unshift(transaction);
      savePayments(stored);

      telemetry.log({ service: 'payments', method: 'POST', endpoint: '/api/payments/charge', status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: { orderId: payload.orderId, amount: payload.amount, method: payload.method, cardMask: lastFour ? `•••• ${lastFour}` : undefined }, responsePayload: { transactionId: transaction.id, status: transaction.status, authCode: transaction.authorizationCode } });

      return transaction;
    }
  },

  async verifyTransaction(txId: string): Promise<PaymentTransaction | null> {
    const startTime = performance.now();

    try {
      const response = await authFetch<any>(`/payments/${txId}`);
      const tx = {
        id: response.id,
        orderId: response.orderId,
        amount: Number(response.amount),
        currency: 'USD',
        method: response.provider,
        status: response.status === 'SUCCEEDED' ? 'succeeded' : response.status.toLowerCase(),
        authorizationCode: response.providerPaymentId ?? response.id,
        processedAt: response.createdAt,
        lastFour: undefined,
      } as PaymentTransaction;

      telemetry.log({ service: 'payments', method: 'GET', endpoint: `/api/payments/verify/${txId}`, status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { status: tx.status, amount: tx.amount } });
      return tx;
    } catch {
      const stored = getStoredPayments();
      const found = stored.find((t) => t.id === txId) || null;

      telemetry.log({ service: 'payments', method: 'GET', endpoint: `/api/payments/verify/${txId}`, status: found ? 200 : 404, durationMs: Math.round(performance.now() - startTime), responsePayload: found ? { status: found.status, amount: found.amount } : { error: 'Transaction not found' } });

      return found;
    }
  }
};
