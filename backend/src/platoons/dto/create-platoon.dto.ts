import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePlatoonDto {
  @ApiProperty({ example: "מחלקה א'", description: 'Platoon name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'רס״ן כהן',
    description: 'Commander name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  commander?: string;

  @ApiProperty({
    example: 'מחלקה ראשונה',
    description: 'Platoon description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
