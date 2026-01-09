import { IsString, IsNotEmpty, IsInt, Min, IsBoolean, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  @Min(0)
  commandersNeeded: number;

  @IsInt()
  @Min(0)
  driversNeeded: number;

  @IsInt()
  @Min(0)
  specialistsNeeded: number;

  @IsInt()
  @Min(0)
  generalSoldiersNeeded: number;

  @IsInt()
  @Min(1)
  shiftDurationHours: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
