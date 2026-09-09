import { LoginCredentials, RegisterPayload, UserSession } from '../types';
import { telemetry } from './telemetry';
import { authFetch, normalizeAuthUser } from './apiClient';

const SESSION_KEY = 'monolith_ecommerce_session';

export const authService = {
  async login(credentials: LoginCredentials): Promise<UserSession> {
    const startTime = performance.now();

    const response = await authFetch<{ accessToken: string; user: { id: string; email: string; firstName?: string; lastName?: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: credentials.email, password: credentials.password ?? '' }),
    });

    const session = normalizeAuthUser({ ...response.user, accessToken: response.accessToken });
    session.token = response.accessToken;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    telemetry.log({ service: 'auth', method: 'POST', endpoint: '/api/auth/login', status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: { email: credentials.email }, responsePayload: { userId: session.id, role: session.role, token: session.token.substring(0, 16) + '...' } });

    return session;
  },

  async register(data: RegisterPayload): Promise<UserSession> {
    const startTime = performance.now();

    const response = await authFetch<{ accessToken: string; user: { id: string; email: string; firstName?: string; lastName?: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password ?? '',
        firstName: data.firstName?.trim() ?? '',
        lastName: data.lastName?.trim() ?? '',
      }),
    });

    const session = normalizeAuthUser({ ...response.user, accessToken: response.accessToken });
    session.token = response.accessToken;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    telemetry.log({ service: 'auth', method: 'POST', endpoint: '/api/auth/register', status: 201, durationMs: Math.round(performance.now() - startTime), requestPayload: { firstName: data.firstName, lastName: data.lastName, email: data.email }, responsePayload: { userId: session.id, role: session.role } });
    return session;
  },

  async getCurrentSession(): Promise<UserSession | null> {
    const startTime = performance.now();
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      return null;
    }

    try {
      const session = JSON.parse(stored) as UserSession;
      telemetry.log({ service: 'auth', method: 'GET', endpoint: '/api/auth/me', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { userId: session.id, role: session.role } });
      return session;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    const startTime = performance.now();

    try {
      await authFetch<void>('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem(SESSION_KEY);
    }

    telemetry.log({ service: 'auth', method: 'POST', endpoint: '/api/auth/logout', status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { message: 'Session terminated successfully' } });
  }
};
