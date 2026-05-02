import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';

export class BatchCreateAssignmentsDto {
  @ApiProperty({ type: [CreateAssignmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssignmentDto)
  assignments: CreateAssignmentDto[];

  @ApiProperty({
    description:
      'If true, delete all non-locked assignments in the date range before creating',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  replaceNonLocked?: boolean;
}
