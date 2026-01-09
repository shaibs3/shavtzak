import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Soldier } from '../soldiers/entities/soldier.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment, AssignmentRole } from '../shifts/entities/shift-assignment.entity';
import { LeaveRecord } from '../leave/entities/leave-record.entity';
import { Deployment } from '../deployment/entities/deployment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ValidationResult } from './interfaces/validation-result.interface';
import { ConstraintViolation, ViolationSeverity } from './interfaces/constraint-violation.interface';

export interface ShiftAssignmentInput {
  soldierId: string;
  role: AssignmentRole;
}

export interface ShiftValidationInput {
  taskId: string;
  startTime: Date;
  endTime: Date;
  assignments: ShiftAssignmentInput[];
  shiftId?: string; // For updates
}

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(Soldier)
    private soldiersRepository: Repository<Soldier>,
    @InjectRepository(Shift)
    private shiftsRepository: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private assignmentsRepository: Repository<ShiftAssignment>,
    @InjectRepository(LeaveRecord)
    private leaveRepository: Repository<LeaveRecord>,
    @InjectRepository(Deployment)
    private deploymentRepository: Repository<Deployment>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async validateShift(input: ShiftValidationInput): Promise<ValidationResult> {
    const violations: ConstraintViolation[] = [];

    // Run all constraint validations
    const qualificationViolations = await this.validateQualifications(input);
    const leaveViolations = await this.validateLeaveConflicts(input);
    const restViolations = await this.validateRestPeriods(input);
    const overlapViolations = await this.validateNoOverlaps(input);
    const presenceViolations = await this.validateMinimumPresence(input);
    const quotaViolations = await this.validateVacationQuota(input);
    const taskRequirements = await this.validateTaskRequirements(input);

    violations.push(
      ...qualificationViolations,
      ...leaveViolations,
      ...restViolations,
      ...overlapViolations,
      ...presenceViolations,
      ...quotaViolations,
      ...taskRequirements,
    );

    const hasErrors = violations.some(v => v.severity === ViolationSeverity.ERROR);

    return {
      isValid: !hasErrors,
      violations,
    };
  }

  // Placeholder methods - will be implemented next
  private async validateQualifications(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    for (const assignment of input.assignments) {
      const soldier = await this.soldiersRepository.findOne({
        where: { id: assignment.soldierId },
      });

      if (!soldier) {
        violations.push({
          severity: ViolationSeverity.ERROR,
          message: `Soldier with ID ${assignment.soldierId} not found`,
          field: 'soldierId',
        });
        continue;
      }

      let isQualified = true;
      let roleLabel = '';

      switch (assignment.role) {
        case AssignmentRole.COMMANDER:
          isQualified = soldier.isCommander;
          roleLabel = 'commander';
          break;
        case AssignmentRole.DRIVER:
          isQualified = soldier.isDriver;
          roleLabel = 'driver';
          break;
        case AssignmentRole.SPECIALIST:
          isQualified = soldier.isSpecialist;
          roleLabel = 'specialist';
          break;
        case AssignmentRole.GENERAL:
          isQualified = true; // All soldiers can be general soldiers
          break;
      }

      if (!isQualified) {
        violations.push({
          severity: ViolationSeverity.ERROR,
          message: `${soldier.name} is not qualified as ${roleLabel}`,
          field: 'assignments',
          details: { soldierId: soldier.id, role: assignment.role },
        });
      }
    }

    return violations;
  }

  private async validateLeaveConflicts(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    for (const assignment of input.assignments) {
      // Get all leave records for this soldier
      const leaveRecords = await this.leaveRepository.find({
        where: { soldierId: assignment.soldierId },
        relations: ['soldier'],
      });

      // Check if shift overlaps with any leave period
      for (const leave of leaveRecords) {
        const shiftStart = new Date(input.startTime);
        const shiftEnd = new Date(input.endTime);
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);

        // Set time to start/end of day for proper date comparison
        leaveStart.setHours(0, 0, 0, 0);
        leaveEnd.setHours(23, 59, 59, 999);

        const overlaps = shiftStart <= leaveEnd && shiftEnd >= leaveStart;

        if (overlaps) {
          violations.push({
            severity: ViolationSeverity.ERROR,
            message: `${leave.soldier.name} is on leave from ${leave.startDate.toISOString().split('T')[0]} to ${leave.endDate.toISOString().split('T')[0]}`,
            field: 'assignments',
            details: { soldierId: assignment.soldierId, leaveId: leave.id },
          });
        }
      }
    }

    return violations;
  }

  private async validateRestPeriods(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    // Get active deployment to check minimum rest hours
    const activeDeployments = await this.deploymentRepository.find({
      where: { isActive: true },
    });

    if (activeDeployments.length === 0) {
      return violations; // No active deployment, skip rest period check
    }

    const deployment = activeDeployments[0];
    const minimumRestHours = deployment.minimumRestHours;

    for (const assignment of input.assignments) {
      // Get recent shifts for this soldier (last 48 hours before new shift starts)
      const lookbackTime = new Date(input.startTime);
      lookbackTime.setHours(lookbackTime.getHours() - 48);

      const recentShifts = await this.shiftsRepository
        .createQueryBuilder('shift')
        .leftJoinAndSelect('shift.assignments', 'assignments')
        .where('assignments.soldierId = :soldierId', { soldierId: assignment.soldierId })
        .andWhere('shift.endTime >= :lookbackTime', { lookbackTime })
        .andWhere('shift.endTime <= :newShiftStart', { newShiftStart: input.startTime })
        .getMany();

      // Check if excluding current shift being updated
      const shiftsToCheck = input.shiftId
        ? recentShifts.filter(s => s.id !== input.shiftId)
        : recentShifts;

      for (const previousShift of shiftsToCheck) {
        const previousShiftEnd = new Date(previousShift.endTime);
        const newShiftStart = new Date(input.startTime);

        const restHours = (newShiftStart.getTime() - previousShiftEnd.getTime()) / (1000 * 60 * 60);

        if (restHours < minimumRestHours) {
          // Get soldier info from assignments
          const previousAssignment = await this.assignmentsRepository.find({
            where: { shiftId: previousShift.id, soldierId: assignment.soldierId },
            relations: ['soldier'],
          });

          const soldierName = previousAssignment[0]?.soldier?.name || 'Soldier';

          violations.push({
            severity: ViolationSeverity.ERROR,
            message: `${soldierName} requires ${minimumRestHours}h rest, but only has ${restHours.toFixed(1)}h between shifts`,
            field: 'assignments',
            details: {
              soldierId: assignment.soldierId,
              previousShiftEnd: previousShiftEnd,
              newShiftStart: newShiftStart,
              restHours: restHours,
              minimumRestHours: minimumRestHours,
            },
          });
        }
      }
    }

    return violations;
  }

  private async validateNoOverlaps(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    for (const assignment of input.assignments) {
      // Find all shifts for this soldier that overlap with the new shift time
      const overlappingShifts = await this.shiftsRepository
        .createQueryBuilder('shift')
        .leftJoinAndSelect('shift.assignments', 'assignments')
        .where('assignments.soldierId = :soldierId', { soldierId: assignment.soldierId })
        .andWhere('shift.startTime < :newShiftEnd', { newShiftEnd: input.endTime })
        .andWhere('shift.endTime > :newShiftStart', { newShiftStart: input.startTime })
        .getMany();

      // Exclude current shift if updating
      const shiftsToCheck = input.shiftId
        ? overlappingShifts.filter(s => s.id !== input.shiftId)
        : overlappingShifts;

      for (const overlappingShift of shiftsToCheck) {
        // Get soldier info
        const soldier = await this.soldiersRepository.findOne({
          where: { id: assignment.soldierId },
        });

        const soldierName = soldier?.name || 'Soldier';

        violations.push({
          severity: ViolationSeverity.ERROR,
          message: `${soldierName} is already assigned to another shift from ${new Date(overlappingShift.startTime).toISOString()} to ${new Date(overlappingShift.endTime).toISOString()}`,
          field: 'assignments',
          details: {
            soldierId: assignment.soldierId,
            conflictingShiftId: overlappingShift.id,
            conflictingShiftStart: overlappingShift.startTime,
            conflictingShiftEnd: overlappingShift.endTime,
          },
        });
      }
    }

    return violations;
  }

  private async validateMinimumPresence(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    // Get active deployment
    const activeDeployments = await this.deploymentRepository.find({
      where: { isActive: true },
    });

    if (activeDeployments.length === 0) {
      return violations; // No active deployment, skip check
    }

    const deployment = activeDeployments[0];
    const requiredCount = Math.ceil(
      (deployment.totalManpower * deployment.minimumPresencePercentage) / 100
    );

    // Count unique soldiers on duty during this shift
    const soldiersOnDuty = new Set<string>();

    // Add soldiers from the new shift
    for (const assignment of input.assignments) {
      soldiersOnDuty.add(assignment.soldierId);
    }

    // Find overlapping shifts to count soldiers already on duty
    const overlappingShifts = await this.shiftsRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.assignments', 'assignments')
      .where('shift.startTime < :endTime', { endTime: input.endTime })
      .andWhere('shift.endTime > :startTime', { startTime: input.startTime })
      .getMany();

    // Exclude current shift if updating
    const shiftsToCheck = input.shiftId
      ? overlappingShifts.filter(s => s.id !== input.shiftId)
      : overlappingShifts;

    // Add soldiers from overlapping shifts
    for (const shift of shiftsToCheck) {
      if (shift.assignments) {
        for (const assignment of shift.assignments) {
          soldiersOnDuty.add(assignment.soldierId);
        }
      }
    }

    const actualCount = soldiersOnDuty.size;
    const actualPercentage = (actualCount / deployment.totalManpower) * 100;

    if (actualCount < requiredCount) {
      violations.push({
        severity: ViolationSeverity.WARNING,
        message: `Minimum presence not met: ${actualCount}/${deployment.totalManpower} soldiers on duty (${actualPercentage.toFixed(1)}%), requires ${deployment.minimumPresencePercentage}% (${requiredCount} soldiers)`,
        field: 'assignments',
        details: {
          requiredCount,
          actualCount,
          requiredPercentage: deployment.minimumPresencePercentage,
          actualPercentage,
        },
      });
    }

    return violations;
  }

  private async validateVacationQuota(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    const violations: ConstraintViolation[] = [];

    for (const assignment of input.assignments) {
      const soldier = await this.soldiersRepository.findOne({
        where: { id: assignment.soldierId },
      });

      if (!soldier) {
        continue; // Already handled by qualification validation
      }

      // Check if soldier has exceeded vacation quota
      if (soldier.vacationDaysUsed >= soldier.vacationQuotaDays) {
        violations.push({
          severity: ViolationSeverity.WARNING,
          message: `${soldier.name} has exceeded vacation quota (${soldier.vacationDaysUsed}/${soldier.vacationQuotaDays} days used)`,
          field: 'assignments',
          details: {
            soldierId: soldier.id,
            vacationQuotaDays: soldier.vacationQuotaDays,
            vacationDaysUsed: soldier.vacationDaysUsed,
          },
        });
      }
    }

    return violations;
  }

  private async validateTaskRequirements(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }
}
