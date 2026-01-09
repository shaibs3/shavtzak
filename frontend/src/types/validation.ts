import { ViolationSeverity } from './entities';

export interface ConstraintViolation {
  severity: ViolationSeverity;
  message: string;
  field?: string;
  details?: any;
}

export interface ValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
}

// API error response when validation fails
export interface ValidationErrorResponse {
  message: string;
  errors: string[];
  warnings: string[];
}
