import { AssignmentRole, ShiftStatus } from './entities';

// Soldier DTOs
export interface CreateSoldierDto {
  name: string;
  rank: string;
  isCommander?: boolean;
  isDriver?: boolean;
  isSpecialist?: boolean;
  vacationQuotaDays?: number;
}

export type UpdateSoldierDto = Partial<CreateSoldierDto>;

// Task DTOs
export interface CreateTaskDto {
  name: string;
  type: string;
  commandersNeeded: number;
  driversNeeded: number;
  specialistsNeeded: number;
  generalSoldiersNeeded: number;
  shiftDurationHours: number;
  isActive?: boolean;
}

export type UpdateTaskDto = Partial<CreateTaskDto>;

// Shift DTOs
export interface ShiftAssignmentDto {
  soldierId: string;
  role: AssignmentRole;
}

export interface CreateShiftDto {
  taskId: string;
  startTime: string;  // ISO 8601
  endTime: string;    // ISO 8601
  status?: ShiftStatus;
  approvedBy?: string;
  assignments: ShiftAssignmentDto[];
}

export type UpdateShiftDto = Partial<CreateShiftDto>;

// Leave DTOs
export interface CreateLeaveRecordDto {
  soldierId: string;
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
  reason?: string;
  enteredBy: string;
}

export type UpdateLeaveRecordDto = Partial<CreateLeaveRecordDto>;

// Deployment DTOs
export interface CreateDeploymentDto {
  name: string;
  startDate: string;  // ISO 8601
  endDate: string;    // ISO 8601
  totalManpower: number;
  minimumPresencePercentage?: number;
  minimumRestHours?: number;
}

export type UpdateDeploymentDto = Partial<CreateDeploymentDto>;
