import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConstraintDto {
  @ApiProperty({
    example: 'vacation',
    enum: ['unavailable', 'vacation', 'medical', 'other'],
  })
  @IsString()
  @IsIn(['unavailable', 'vacation', 'medical', 'other'])
  type: string;

  @ApiProperty({ example: '2026-01-25' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-27' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'חופשה משפחתית', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
