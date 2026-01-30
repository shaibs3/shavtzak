import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AutoAssignDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2', 'uuid3'],
    description: 'Array of platoon IDs to distribute soldiers among',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  platoonIds: string[];
}
