import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platoon, CreatePlatoonDto, UpdatePlatoonDto } from '@/types/scheduling';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function usePlatoons() {
  return useQuery({
    queryKey: ['platoons'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/platoons`);
      if (!response.ok) throw new Error('Failed to fetch platoons');
      return response.json() as Promise<Platoon[]>;
    },
  });
}

export function useCreatePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlatoonDto) => {
      const response = await fetch(`${API_URL}/platoons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create platoon');
      return response.json() as Promise<Platoon>;
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
      const response = await fetch(`${API_URL}/platoons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update platoon');
      return response.json() as Promise<Platoon>;
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
      const response = await fetch(`${API_URL}/platoons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 409) {
          const error = await response.json();
          throw new Error(JSON.stringify(error));
        }
        throw new Error('Failed to delete platoon');
      }
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
      const response = await fetch(`${API_URL}/platoons/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platoonIds }),
      });
      if (!response.ok) throw new Error('Failed to auto-assign');
      return response.json() as Promise<{ assignedCount: number }>;
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
      const response = await fetch(`${API_URL}/soldiers/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soldierIds, platoonId }),
      });
      if (!response.ok) throw new Error('Failed to bulk update soldiers');
      return response.json() as Promise<{ updatedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
    },
  });
}
