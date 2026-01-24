import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService } from '@/services/assignments.service';
import { toast } from '@/components/ui/use-toast';
import type { CreateAssignmentDto, UpdateAssignmentDto } from '@/types/scheduling';

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const response = await assignmentsService.getAll();
      return response.data;
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentDto) => assignmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ נוסף בהצלחה' });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentDto }) =>
      assignmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ עודכן בהצלחה' });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ נמחק בהצלחה' });
    },
  });
};
