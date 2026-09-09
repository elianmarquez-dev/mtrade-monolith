import { UserAddress, UserProfile } from '../types';
import { authFetch } from './apiClient';

export const usersApi = {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await authFetch<any>(`/users/${userId}`);
    return {
      id: user.id,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
      email: user.email,
      phone: '+34 612 345 678',
      role: 'customer',
      addresses: [],
      createdAt: user.createdAt,
      preferredCurrency: 'USD',
    } as UserProfile;
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await authFetch<any>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ firstName: data.name?.split(' ')[0] ?? '', lastName: data.name?.split(' ').slice(1).join(' ') ?? '' }) });
    return this.getProfile(userId);
  },

  async getAddresses(userId: string): Promise<UserAddress[]> {
    return authFetch<any[]>(`/users/${userId}/addresses`).catch(() => []);
  },

  async addAddress(userId: string, address: Omit<UserAddress, 'id'>): Promise<UserAddress> {
    return authFetch<any>(`/users/${userId}/addresses`, { method: 'POST', body: JSON.stringify(address) });
  }
};
