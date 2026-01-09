import { IsString, IsNotEmpty, IsDateString, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ShiftAssignmentDto } from './shift-assignment.dto';
import { ShiftStatus } from '../entities/shift.entity';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftAssignmentDto)
  assignments: ShiftAssignmentDto[];
}
