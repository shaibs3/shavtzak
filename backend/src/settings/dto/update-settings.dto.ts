import { IsInt, Min, Max, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: 75, minimum: 0, maximum: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minBasePresence?: number;

  @ApiProperty({ example: 20, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalSoldiers?: number;

  @ApiProperty({
    example: '2026-02-01',
    description: 'Operational period start date (ISO date format)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  operationalStartDate?: string;

  @ApiProperty({
    example: '2026-05-31',
    description: 'Operational period end date (ISO date format)',
    required: false
  })
  @IsOptional()
  @IsDateString()
  operationalEndDate?: string;
}
