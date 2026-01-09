import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateLeaveRecordDto {
  @IsString()
  @IsNotEmpty()
  soldierId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  enteredBy: string;
}
