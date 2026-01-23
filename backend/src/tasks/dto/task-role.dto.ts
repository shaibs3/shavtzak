import { IsString, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskRoleDto {
  @ApiProperty({ example: 'commander', enum: ['commander', 'driver', 'radio_operator', 'soldier'] })
  @IsString()
  @IsIn(['commander', 'driver', 'radio_operator', 'soldier'])
  role: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  count: number;
}
