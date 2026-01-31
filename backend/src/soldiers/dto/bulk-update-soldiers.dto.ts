import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, IsOptional } from 'class-validator';

export class BulkUpdateSoldiersDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'Array of soldier IDs to update',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  soldierIds: string[];

  @ApiProperty({
    example: 'uuid-platoon',
    description: 'Platoon ID to assign (or null to remove)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  platoonId?: string | null;
}
