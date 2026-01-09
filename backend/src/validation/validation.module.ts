import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationService } from './validation.service';
import { Soldier } from '../soldiers/entities/soldier.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { LeaveRecord } from '../leave/entities/leave-record.entity';
import { Deployment } from '../deployment/entities/deployment.entity';
import { Task } from '../tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Soldier,
      Shift,
      ShiftAssignment,
      LeaveRecord,
      Deployment,
      Task,
    ]),
  ],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
