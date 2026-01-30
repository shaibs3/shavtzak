import { IsString, IsArray, IsInt, Min, Max, ArrayMinSize, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSoldierDto {
  @ApiProperty({ example: 'יוסי כהן' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'סמל' })
  @IsString()
  rank: string;

  @ApiProperty({ example: ['driver', 'soldier'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ example: 5, default: 5 })
  @IsInt()
  @Min(0)
  @Max(365)
  maxVacationDays: number;

  @ApiProperty({ example: 0, default: 0 })
  @IsInt()
  @Min(0)
  usedVacationDays: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Platoon ID',
    required: false
  })
  @IsUUID()
  @IsOptional()
  platoonId?: string;
}
