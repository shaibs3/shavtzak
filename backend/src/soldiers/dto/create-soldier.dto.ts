import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSoldierDto {
  @ApiProperty({ example: 'John Doe', description: 'Soldier full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Sergeant', description: 'Military rank' })
  @IsString()
  @IsNotEmpty()
  rank: string;

  @ApiProperty({ example: false, description: 'Can serve as commander', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isCommander?: boolean;

  @ApiProperty({ example: false, description: 'Can serve as driver', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDriver?: boolean;

  @ApiProperty({ example: false, description: 'Can serve as specialist', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isSpecialist?: boolean;

  @ApiProperty({ example: 20, description: 'Total vacation days allowed', required: false, default: 20 })
  @IsInt()
  @Min(0)
  @IsOptional()
  vacationQuotaDays?: number;
}
