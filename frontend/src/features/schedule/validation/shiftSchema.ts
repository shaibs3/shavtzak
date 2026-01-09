import { z } from 'zod';
import { AssignmentRole, ShiftStatus } from '../../../types/entities';

export const shiftAssignmentSchema = z.object({
  soldierId: z.string().min(1, 'Soldier is required'),
  role: z.nativeEnum(AssignmentRole),
});

export const createShiftSchema = z.object({
  taskId: z.string().min(1, 'Task is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  status: z.nativeEnum(ShiftStatus).optional(),
  approvedBy: z.string().optional(),
  assignments: z.array(shiftAssignmentSchema).min(1, 'At least one assignment required'),
});

export type ShiftFormData = z.infer<typeof createShiftSchema>;
