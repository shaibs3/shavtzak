export interface Soldier {
  id: string;
  name: string;
  rank: string;
  roles: Role[];
  constraints: Constraint[];
  maxVacationDays: number;
  usedVacationDays: number;
}

export interface Constraint {
  id: string;
  type: 'unavailable' | 'vacation' | 'medical' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export type Role = 'commander' | 'driver' | 'radio_operator' | 'soldier';

export const roleLabels: Record<Role, string> = {
  commander: 'מפקד',
  driver: 'נהג',
  radio_operator: 'פקל',
  soldier: 'חייל',
};

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
