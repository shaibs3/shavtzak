import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { soldiersService } from '@/services/soldiers.service';
import { toast } from '@/components/ui/use-toast';
import type { CreateSoldierDto, UpdateSoldierDto, CreateConstraintDto } from '@/types/scheduling';

export const useSoldiers = () => {
  return useQuery({
    queryKey: ['soldiers'],
    queryFn: async () => {
      const response = await soldiersService.getAll();
      console.log('API returned soldiers:', response.data.length);
      return response.data;
    },
    staleTime: 0,
    gcTime: 0,
  });
};

export const useCreateSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSoldierDto) => soldiersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל נוסף בהצלחה' });
    },
  });
};

export const useUpdateSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSoldierDto }) =>
      soldiersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל עודכן בהצלחה' });
    },
  });
};

export const useDeleteSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soldiersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל נמחק בהצלחה' });
    },
  });
};

export const useAddConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ soldierId, data }: { soldierId: string; data: CreateConstraintDto }) =>
      soldiersService.addConstraint(soldierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'המגבלה נוספה בהצלחה' });
    },
  });
};

export const useRemoveConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ soldierId, constraintId }: { soldierId: string; constraintId: string }) =>
      soldiersService.removeConstraint(soldierId, constraintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'המגבלה הוסרה בהצלחה' });
    },
  });
};
