import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveRecordDto } from './create-leave-record.dto';

export class UpdateLeaveRecordDto extends PartialType(CreateLeaveRecordDto) {}
