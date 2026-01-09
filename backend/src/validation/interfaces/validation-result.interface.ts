import { ConstraintViolation } from './constraint-violation.interface';

export interface ValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
}
