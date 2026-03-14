import { apiClient } from './api';
import type { Settings, UpdateSettingsDto } from '@/types/scheduling';

export const settingsService = {
  get: () => apiClient.get<Settings>('/settings'),

  update: (data: UpdateSettingsDto) =>
    apiClient.patch<Settings>('/settings', data),
};
