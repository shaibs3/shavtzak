export enum ViolationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ConstraintViolation {
  severity: ViolationSeverity;
  message: string;
  field?: string;
  details?: any;
}
