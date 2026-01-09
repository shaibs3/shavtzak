import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  totalManpower: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minimumPresencePercentage?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minimumRestHours?: number;
}
