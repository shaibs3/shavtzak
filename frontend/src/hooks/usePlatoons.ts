import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platoon, CreatePlatoonDto, UpdatePlatoonDto } from '@/types/scheduling';
import { apiClient } from '@/services/api';

export function usePlatoons() {
  return useQuery({
    queryKey: ['platoons'],
    queryFn: async () => {
      const { data } = await apiClient.get<Platoon[]>('/platoons');
      return data;
    },
  });
}

export function useCreatePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlatoonDto) => {
      const { data: platoon } = await apiClient.post<Platoon>('/platoons', data);
      return platoon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useUpdatePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlatoonDto }) => {
      const { data: platoon } = await apiClient.patch<Platoon>(`/platoons/${id}`, data);
      return platoon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useDeletePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/platoons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useAutoAssignPlatoons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platoonIds: string[]) => {
      const { data } = await apiClient.post<{ assignedCount: number }>('/platoons/auto-assign', { platoonIds });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
    },
  });
}

export function useBulkUpdateSoldiers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ soldierIds, platoonId }: { soldierIds: string[]; platoonId: string | null }) => {
      const { data } = await apiClient.patch<{ updatedCount: number }>('/soldiers/bulk-update', { soldierIds, platoonId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
    },
  });
}
