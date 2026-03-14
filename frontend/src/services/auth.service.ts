import { apiClient } from './api';
import type { User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getMe: () => apiClient.get<User>('/auth/me'),

  getGoogleAuthUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseUrl}/auth/google`;
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  },
};
