// Base entity
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Enums
export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum AssignmentRole {
  COMMANDER = 'commander',
  DRIVER = 'driver',
  SPECIALIST = 'specialist',
  GENERAL = 'general',
}

export enum ViolationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

// Entities
export interface Soldier extends BaseEntity {
  name: string;
  rank: string;
  isCommander: boolean;
  isDriver: boolean;
  isSpecialist: boolean;
  vacationQuotaDays: number;
  vacationDaysUsed: number;
}

export interface Task extends BaseEntity {
  name: string;
  type: string;
  commandersNeeded: number;
  driversNeeded: number;
  specialistsNeeded: number;
  generalSoldiersNeeded: number;
  shiftDurationHours: number;
  isActive: boolean;
}

export interface ShiftAssignment extends BaseEntity {
  shiftId: string;
  soldierId: string;
  role: AssignmentRole;
  assignedAt: string;
  soldier?: Soldier;
}

export interface Shift extends BaseEntity {
  taskId: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  approvedBy?: string;
  task?: Task;
  approver?: Soldier;
  assignments: ShiftAssignment[];
  warnings?: string[];  // Validation warnings
}

export interface LeaveRecord extends BaseEntity {
  soldierId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  enteredBy: string;
  soldier?: Soldier;
}

export interface Deployment extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  totalManpower: number;
  minimumPresencePercentage: number;
  minimumRestHours: number;
  isActive: boolean;
}
