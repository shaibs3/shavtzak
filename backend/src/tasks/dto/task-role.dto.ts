import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskRoleDto {
  @ApiProperty({
    example: 'commander',
    description: 'Role name (can be any string, including custom roles)',
  })
  @IsString()
  role: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  count: number;
}
