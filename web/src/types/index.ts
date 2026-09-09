// TypeScript definitions for the 5 modular monolith backend services
// Services: Auth, Users, Products, Orders, Payments

export type ServiceName = 'auth' | 'users' | 'products' | 'orders' | 'payments';

export interface ServiceHealth {
  name: ServiceName;
  displayName: string;
  status: 'healthy' | 'degraded' | 'offline';
  version: string;
  endpointsCount: number;
  description: string;
}

export interface ServiceCallLog {
  id: string;
  timestamp: string;
  service: ServiceName;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  status: number;
  durationMs: number;
  requestPayload?: any;
  responsePayload?: any;
}

// ----------------------------------------------------
// 1. AUTH SERVICE TYPES
// ----------------------------------------------------
export type UserRole = 'customer' | 'admin';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface AuthResponse {
  session: UserSession;
  token: string;
}

export interface RegisterPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  phone?: string;
}

// ----------------------------------------------------
// 2. USERS SERVICE TYPES
// ----------------------------------------------------
export interface UserAddress {
  id: string;
  label: string; // e.g. "Casa", "Oficina"
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses: UserAddress[];
  createdAt: string;
  preferredCurrency: string;
}

// ----------------------------------------------------
// 3. PRODUCTS SERVICE TYPES
// ----------------------------------------------------
export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  sku: string;
  isFeatured?: boolean;
  tags: string[];
}

export interface ProductFilter {
  category?: string;
  search?: string;
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  inStockOnly?: boolean;
}

// ----------------------------------------------------
// 4. ORDERS SERVICE TYPES
// ----------------------------------------------------
export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sku: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  shippingAddress: UserAddress;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  createdAt: string;
  trackingNumber?: string;
}

export interface CreateOrderPayload {
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  shippingAddress: UserAddress;
}

// ----------------------------------------------------
// 5. PAYMENTS SERVICE TYPES
// ----------------------------------------------------
export type PaymentMethodType = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';

export interface PaymentMethodOption {
  id: PaymentMethodType;
  name: string;
  description: string;
  iconName: string;
}

export interface ProcessPaymentPayload {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  cardDetails?: {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
  };
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: 'succeeded' | 'failed' | 'pending';
  authorizationCode: string;
  processedAt: string;
  lastFour?: string;
}
