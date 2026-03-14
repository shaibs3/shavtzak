export interface Soldier {
  id: string;
  name: string;
  rank: string;
  roles: Role[];
  constraints: Constraint[];
  maxVacationDays: number;
  usedVacationDays: number;
  platoonId: string | null;
  platoon?: Platoon;
}

export interface Constraint {
  id: string;
  type: 'unavailable' | 'vacation' | 'medical' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export type Role = string;

// Default roles (always available)
export const DEFAULT_ROLES: Role[] = ['commander', 'driver', 'soldier'];

// Default role labels
export const DEFAULT_ROLE_LABELS: Record<string, string> = {
  commander: 'מפקד',
  driver: 'נהג',
  soldier: 'חייל',
};

// Helper function to get role label (supports custom roles)
export function getRoleLabel(role: Role, customRoleLabels?: Record<string, string>): string {
  if (customRoleLabels && customRoleLabels[role]) {
    return customRoleLabels[role];
  }
  return DEFAULT_ROLE_LABELS[role] || role;
}

// Helper function to get all available roles (default + custom)
export function getAllRoles(customRoles: string[] = []): Role[] {
  return [...DEFAULT_ROLES, ...customRoles];
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  requiredRoles: TaskRole[];
  /** 0-23. Used for fairness rules like consecutive night shifts. */
  shiftStartHour: number;
  shiftDuration: number; // in hours
  restTimeBetweenShifts: number; // in hours
  isActive: boolean;
}

export interface TaskRole {
  role: Role;
  count: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  soldierId: string;
  role: Role;
  startTime: Date;
  endTime: Date;
  /** Manual override: locked assignments are not changed by auto scheduling. */
  locked: boolean;
}

export interface ScheduleSettings {
  minBasePresence: number; // percentage (e.g., 75)
  totalSoldiers: number;
}

export interface Settings {
  id: string;
  minBasePresence: number;
  totalSoldiers: number;
  operationalStartDate: string | null;
  operationalEndDate: string | null;
  updatedAt: string;
}

export interface Platoon {
  id: string;
  name: string;
  commander: string | null;
  color: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  soldiers?: Soldier[];
}

export type CreatePlatoonDto = Omit<Platoon, 'id' | 'color' | 'createdAt' | 'updatedAt' | 'soldiers'>;
export type UpdatePlatoonDto = Partial<CreatePlatoonDto>;

// DTOs for API requests
export type CreateSoldierDto = Omit<Soldier, 'id' | 'constraints' | 'platoon'>;
export type UpdateSoldierDto = Partial<CreateSoldierDto>;

export type CreateConstraintDto = Omit<Constraint, 'id'>;

export type CreateTaskDto = Omit<Task, 'id'>;
export type UpdateTaskDto = Partial<CreateTaskDto>;

export type CreateAssignmentDto = Omit<Assignment, 'id'>;
export type UpdateAssignmentDto = Partial<CreateAssignmentDto>;

export type UpdateSettingsDto = Partial<ScheduleSettings>;
