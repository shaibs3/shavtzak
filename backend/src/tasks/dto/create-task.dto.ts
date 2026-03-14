import {
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskRoleDto } from './task-role.dto';

export class CreateTaskDto {
  @ApiProperty({ example: 'שמירה בשער' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'משמרת שמירה בכניסה הראשית', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [TaskRoleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskRoleDto)
  requiredRoles: TaskRoleDto[];

  @ApiProperty({ example: 8, minimum: 0, maximum: 23 })
  @IsInt()
  @Min(0)
  @Max(23)
  shiftStartHour: number;

  @ApiProperty({ example: 8, minimum: 1 })
  @IsInt()
  @Min(1)
  shiftDuration: number;

  @ApiProperty({ example: 12, minimum: 0 })
  @IsInt()
  @Min(0)
  restTimeBetweenShifts: number;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  isActive: boolean;
}
