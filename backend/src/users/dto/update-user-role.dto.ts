import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin', enum: ['admin', 'viewer'] })
  @IsIn(['admin', 'viewer'])
  role: 'admin' | 'viewer';
}
