import { apiClient } from './api';
import type { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '@/types/scheduling';

export const assignmentsService = {
  getAll: () => apiClient.get<Assignment[]>('/assignments'),

  getById: (id: string) => apiClient.get<Assignment>(`/assignments/${id}`),

  create: (data: CreateAssignmentDto) => apiClient.post<Assignment>('/assignments', data),

  update: (id: string, data: UpdateAssignmentDto) =>
    apiClient.patch<Assignment>(`/assignments/${id}`, data),

  remove: (id: string) => apiClient.delete(`/assignments/${id}`),
};
