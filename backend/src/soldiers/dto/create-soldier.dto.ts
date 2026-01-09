import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSoldierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  rank: string;

  @IsBoolean()
  @IsOptional()
  isCommander?: boolean;

  @IsBoolean()
  @IsOptional()
  isDriver?: boolean;

  @IsBoolean()
  @IsOptional()
  isSpecialist?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  vacationQuotaDays?: number;
}
