import { apiClient } from './api';
import type { User } from '@/types/auth';

export const usersService = {
  getAll: () => apiClient.get<User[]>('/users'),
  updateRole: (id: string, role: 'admin' | 'viewer') =>
    apiClient.patch<User>(`/users/${id}/role`, { role }),
};
