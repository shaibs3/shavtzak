import { apiClient } from './api';
import type { ScheduleSettings, UpdateSettingsDto } from '@/types/scheduling';

export const settingsService = {
  get: () => apiClient.get<ScheduleSettings>('/settings'),

  update: (data: UpdateSettingsDto) =>
    apiClient.patch<ScheduleSettings>('/settings', data),
};
