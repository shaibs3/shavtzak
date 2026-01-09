import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { AssignmentRole } from '../entities/shift-assignment.entity';

export class ShiftAssignmentDto {
  @IsString()
  @IsNotEmpty()
  soldierId: string;

  @IsEnum(AssignmentRole)
  role: AssignmentRole;
}
