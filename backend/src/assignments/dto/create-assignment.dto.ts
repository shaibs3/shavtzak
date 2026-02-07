import { IsString, IsUUID, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  soldierId: string;

  @ApiProperty({
    example: 'commander',
    description: 'Role name (can be any string, including custom roles)',
  })
  @IsString()
  role: string;

  @ApiProperty({ example: '2026-01-25T08:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-01-25T16:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  locked: boolean;
}
