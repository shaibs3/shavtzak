import { apiClient } from './api';
import type { Soldier, CreateSoldierDto, UpdateSoldierDto, CreateConstraintDto } from '@/types/scheduling';

export const soldiersService = {
  getAll: () => apiClient.get<Soldier[]>('/soldiers'),

  getById: (id: string) => apiClient.get<Soldier>(`/soldiers/${id}`),

  create: (data: CreateSoldierDto) => apiClient.post<Soldier>('/soldiers', data),

  update: (id: string, data: UpdateSoldierDto) =>
    apiClient.patch<Soldier>(`/soldiers/${id}`, data),

  remove: (id: string) => apiClient.delete(`/soldiers/${id}`),

  addConstraint: (soldierId: string, data: CreateConstraintDto) =>
    apiClient.post<Soldier>(`/soldiers/${soldierId}/constraints`, data),

  removeConstraint: (soldierId: string, constraintId: string) =>
    apiClient.delete(`/soldiers/${soldierId}/constraints/${constraintId}`),
};
