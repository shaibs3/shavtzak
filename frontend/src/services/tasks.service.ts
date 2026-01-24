import { apiClient } from './api';
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types/scheduling';

export const tasksService = {
  getAll: () => apiClient.get<Task[]>('/tasks'),

  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),

  create: (data: CreateTaskDto) => apiClient.post<Task>('/tasks', data),

  update: (id: string, data: UpdateTaskDto) =>
    apiClient.patch<Task>(`/tasks/${id}`, data),

  remove: (id: string) => apiClient.delete(`/tasks/${id}`),
};
