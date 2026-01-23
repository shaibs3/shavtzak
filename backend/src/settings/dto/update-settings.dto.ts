import { IsInt, Min, Max, IsOptional } from 'class-validator';
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
}
