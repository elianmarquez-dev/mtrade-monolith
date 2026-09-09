import { UserAddress, UserProfile } from '../types';
import { DEMO_ADMIN, DEMO_USER } from './initialData';
import { telemetry } from './telemetry';
import { authFetch } from './apiClient';

const USERS_STORAGE_KEY = 'monolith_ecommerce_users';

function getStoredUsers(): Record<string, UserProfile> {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  const defaults: Record<string, UserProfile> = {
    [DEMO_USER.id]: DEMO_USER,
    [DEMO_ADMIN.id]: DEMO_ADMIN,
  };
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveUsers(users: Record<string, UserProfile>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export const usersService = {
  async getUsers(): Promise<UserProfile[]> {
    const users = await authFetch<any[]>('/users/all');
    return users.map((user) => ({
      id: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      email: user.email,
      phone: '+34 600 123 456',
      role: 'customer',
      preferredCurrency: 'USD',
      createdAt: user.createdAt,
      addresses: [],
    } as UserProfile));
  },

  async getUserById(userId: string): Promise<UserProfile> {
    return this.getProfile(userId);
  },

  async createUser(payload: { email: string; firstName?: string; lastName?: string }): Promise<UserProfile> {
    const user = await authFetch<any>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      id: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      email: user.email,
      phone: '+34 600 123 456',
      role: 'customer',
      preferredCurrency: 'USD',
      createdAt: user.createdAt,
      addresses: [],
    } as UserProfile;
  },

  async removeUser(userId: string): Promise<{ success: boolean; userId: string }> {
    return authFetch<{ success: boolean; userId: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const startTime = performance.now();

    try {
      const user = await authFetch<any>(`/users/${userId}`);
      const profile = {
        id: user.id,
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
        email: user.email,
        phone: '+34 600 123 456',
        role: 'customer',
        preferredCurrency: 'USD',
        createdAt: user.createdAt,
        addresses: [],
      } as UserProfile;

      telemetry.log({ service: 'users', method: 'GET', endpoint: `/api/users/${userId}/profile`, status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { id: profile.id, name: profile.name, email: profile.email, addressesCount: profile.addresses.length } });
      return profile;
    } catch {
      const users = getStoredUsers();
      let profile = users[userId];

      if (!profile) {
        profile = {
          id: userId,
          name: 'Usuario Registrado',
          email: 'usuario@example.com',
          phone: '+34 600 123 456',
          role: 'customer',
          preferredCurrency: 'USD',
          createdAt: new Date().toISOString(),
          addresses: DEMO_USER.addresses,
        };
        users[userId] = profile;
        saveUsers(users);
      }

      telemetry.log({ service: 'users', method: 'GET', endpoint: `/api/users/${userId}/profile`, status: 200, durationMs: Math.round(performance.now() - startTime), responsePayload: { id: profile.id, name: profile.name, email: profile.email, addressesCount: profile.addresses.length } });
      return profile;
    }
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const startTime = performance.now();

    try {
      const firstName = data.name?.split(' ')[0] ?? '';
      const lastName = data.name?.split(' ').slice(1).join(' ') ?? '';
      await authFetch<any>(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName }),
      });

      const current = await this.getProfile(userId);
      const updated: UserProfile = { ...current, ...data };
      telemetry.log({ service: 'users', method: 'PUT', endpoint: `/api/users/${userId}/profile`, status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: data, responsePayload: { success: true, updatedFields: Object.keys(data) } });
      return updated;
    } catch {
      const users = getStoredUsers();
      const current = users[userId] || DEMO_USER;
      const updated: UserProfile = { ...current, ...data };
      users[userId] = updated;
      saveUsers(users);

      telemetry.log({ service: 'users', method: 'PUT', endpoint: `/api/users/${userId}/profile`, status: 200, durationMs: Math.round(performance.now() - startTime), requestPayload: data, responsePayload: { success: true, updatedFields: Object.keys(data) } });
      return updated;
    }
  },

  async getAddresses(userId: string): Promise<UserAddress[]> {
    try {
      return await authFetch<UserAddress[]>(`/users/${userId}/addresses`);
    } catch {
      const profile = await this.getProfile(userId);
      return profile.addresses || [];
    }
  },

  async addAddress(userId: string, address: Omit<UserAddress, 'id'>): Promise<UserAddress> {
    const startTime = performance.now();

    try {
      const response = await authFetch<any>(`/users/${userId}/addresses`, { method: 'POST', body: JSON.stringify(address) });
      telemetry.log({ service: 'users', method: 'POST', endpoint: `/api/users/${userId}/addresses`, status: 201, durationMs: Math.round(performance.now() - startTime), requestPayload: { label: address.label, city: address.city }, responsePayload: { addressId: response.id } });
      return response;
    } catch {
      const users = getStoredUsers();
      const current = users[userId] || DEMO_USER;

      const newAddress: UserAddress = {
        ...address,
        id: 'addr-' + Math.random().toString(36).substring(2, 7),
      };

      const updatedAddresses: UserAddress[] = address.isDefault
        ? [...current.addresses.map((a) => ({ ...a, isDefault: false })), newAddress]
        : [...current.addresses, newAddress];

      users[userId] = { ...current, addresses: updatedAddresses };
      saveUsers(users);

      telemetry.log({ service: 'users', method: 'POST', endpoint: `/api/users/${userId}/addresses`, status: 201, durationMs: Math.round(performance.now() - startTime), requestPayload: { label: address.label, city: address.city }, responsePayload: { addressId: newAddress.id } });
      return newAddress;
    }
  }
};
