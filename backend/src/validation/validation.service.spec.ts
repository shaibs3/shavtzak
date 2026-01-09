import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ValidationService, ShiftValidationInput } from './validation.service';
import { Soldier } from '../soldiers/entities/soldier.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { ShiftAssignment, AssignmentRole } from '../shifts/entities/shift-assignment.entity';
import { LeaveRecord } from '../leave/entities/leave-record.entity';
import { Deployment } from '../deployment/entities/deployment.entity';
import { Task } from '../tasks/entities/task.entity';
import { ViolationSeverity } from './interfaces/constraint-violation.interface';

describe('ValidationService - Qualifications', () => {
  let service: ValidationService;
  let soldiersRepository: Repository<Soldier>;
  let shiftsRepository: Repository<Shift>;
  let leaveRepository: Repository<LeaveRecord>;
  let deploymentRepository: Repository<Deployment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        { provide: getRepositoryToken(Soldier), useClass: Repository },
        { provide: getRepositoryToken(Shift), useClass: Repository },
        { provide: getRepositoryToken(ShiftAssignment), useClass: Repository },
        { provide: getRepositoryToken(LeaveRecord), useClass: Repository },
        { provide: getRepositoryToken(Deployment), useClass: Repository },
        { provide: getRepositoryToken(Task), useClass: Repository },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    soldiersRepository = module.get<Repository<Soldier>>(getRepositoryToken(Soldier));
    shiftsRepository = module.get<Repository<Shift>>(getRepositoryToken(Shift));
    leaveRepository = module.get<Repository<LeaveRecord>>(getRepositoryToken(LeaveRecord));
    deploymentRepository = module.get<Repository<Deployment>>(getRepositoryToken(Deployment));
  });

  it('should reject commander assignment for non-commander soldier', async () => {
    const soldier = { id: '1', name: 'John', isCommander: false, isDriver: false, isSpecialist: false } as Soldier;
    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      endTime: new Date('2026-01-10T16:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].severity).toBe(ViolationSeverity.ERROR);
    expect(result.violations[0].message).toContain('not qualified');
  });

  it('should accept qualified commander', async () => {
    const soldier = { id: '1', name: 'John', isCommander: true, isDriver: false, isSpecialist: false } as Soldier;
    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      endTime: new Date('2026-01-10T16:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const qualificationErrors = result.violations.filter(
      v => v.message.includes('not qualified')
    );
    expect(qualificationErrors).toHaveLength(0);
  });
});

describe('ValidationService - Leave Conflicts', () => {
  let service: ValidationService;
  let soldiersRepository: Repository<Soldier>;
  let shiftsRepository: Repository<Shift>;
  let leaveRepository: Repository<LeaveRecord>;
  let deploymentRepository: Repository<Deployment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        { provide: getRepositoryToken(Soldier), useClass: Repository },
        { provide: getRepositoryToken(Shift), useClass: Repository },
        { provide: getRepositoryToken(ShiftAssignment), useClass: Repository },
        { provide: getRepositoryToken(LeaveRecord), useClass: Repository },
        { provide: getRepositoryToken(Deployment), useClass: Repository },
        { provide: getRepositoryToken(Task), useClass: Repository },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    soldiersRepository = module.get<Repository<Soldier>>(getRepositoryToken(Soldier));
    shiftsRepository = module.get<Repository<Shift>>(getRepositoryToken(Shift));
    leaveRepository = module.get<Repository<LeaveRecord>>(getRepositoryToken(LeaveRecord));
    deploymentRepository = module.get<Repository<Deployment>>(getRepositoryToken(Deployment));
  });

  it('should reject shift assignment for soldier on leave', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;
    const leave = {
      soldierId: '1',
      startDate: new Date('2026-01-09'),
      endDate: new Date('2026-01-11'),
      soldier,
    } as LeaveRecord;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([leave]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      endTime: new Date('2026-01-10T16:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const leaveViolations = result.violations.filter(v => v.message.includes('on leave'));
    expect(leaveViolations.length).toBeGreaterThan(0);
    expect(leaveViolations[0].severity).toBe(ViolationSeverity.ERROR);
  });

  it('should accept shift assignment for soldier not on leave', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      endTime: new Date('2026-01-10T16:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const leaveViolations = result.violations.filter(v => v.message.includes('on leave'));
    expect(leaveViolations).toHaveLength(0);
  });
});

describe('ValidationService - Rest Periods', () => {
  let service: ValidationService;
  let soldiersRepository: Repository<Soldier>;
  let shiftsRepository: Repository<Shift>;
  let assignmentsRepository: Repository<ShiftAssignment>;
  let leaveRepository: Repository<LeaveRecord>;
  let deploymentRepository: Repository<Deployment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        { provide: getRepositoryToken(Soldier), useClass: Repository },
        { provide: getRepositoryToken(Shift), useClass: Repository },
        { provide: getRepositoryToken(ShiftAssignment), useClass: Repository },
        { provide: getRepositoryToken(LeaveRecord), useClass: Repository },
        { provide: getRepositoryToken(Deployment), useClass: Repository },
        { provide: getRepositoryToken(Task), useClass: Repository },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    soldiersRepository = module.get<Repository<Soldier>>(getRepositoryToken(Soldier));
    shiftsRepository = module.get<Repository<Shift>>(getRepositoryToken(Shift));
    assignmentsRepository = module.get<Repository<ShiftAssignment>>(getRepositoryToken(ShiftAssignment));
    leaveRepository = module.get<Repository<LeaveRecord>>(getRepositoryToken(LeaveRecord));
    deploymentRepository = module.get<Repository<Deployment>>(getRepositoryToken(Deployment));
  });

  it('should reject shift when soldier has insufficient rest period', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;
    const previousShift = {
      id: 'shift1',
      startTime: new Date('2026-01-10T06:00:00Z'),
      endTime: new Date('2026-01-10T14:00:00Z'),
    } as Shift;
    const previousAssignment = {
      soldierId: '1',
      shiftId: 'shift1',
      soldier,
    } as ShiftAssignment;

    const deployment = {
      minimumRestHours: 12,
      isActive: true,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-01'),
    } as Deployment;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([previousShift]),
    } as any);
    jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([previousAssignment]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([deployment]);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T18:00:00Z'), // Only 4 hours after previous shift
      endTime: new Date('2026-01-10T22:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const restViolations = result.violations.filter(v => v.message.includes('rest'));
    expect(restViolations.length).toBeGreaterThan(0);
    expect(restViolations[0].severity).toBe(ViolationSeverity.ERROR);
  });

  it('should accept shift when soldier has sufficient rest period', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;
    const previousShift = {
      id: 'shift1',
      startTime: new Date('2026-01-10T06:00:00Z'),
      endTime: new Date('2026-01-10T14:00:00Z'),
    } as Shift;

    const deployment = {
      minimumRestHours: 12,
      isActive: true,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-02-01'),
    } as Deployment;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([previousShift]),
    } as any);
    jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([deployment]);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-11T06:00:00Z'), // 16 hours after previous shift
      endTime: new Date('2026-01-11T14:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const restViolations = result.violations.filter(v => v.message.includes('rest'));
    expect(restViolations).toHaveLength(0);
  });
});

describe('ValidationService - Overlap Detection', () => {
  let service: ValidationService;
  let soldiersRepository: Repository<Soldier>;
  let shiftsRepository: Repository<Shift>;
  let assignmentsRepository: Repository<ShiftAssignment>;
  let leaveRepository: Repository<LeaveRecord>;
  let deploymentRepository: Repository<Deployment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        { provide: getRepositoryToken(Soldier), useClass: Repository },
        { provide: getRepositoryToken(Shift), useClass: Repository },
        { provide: getRepositoryToken(ShiftAssignment), useClass: Repository },
        { provide: getRepositoryToken(LeaveRecord), useClass: Repository },
        { provide: getRepositoryToken(Deployment), useClass: Repository },
        { provide: getRepositoryToken(Task), useClass: Repository },
      ],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
    soldiersRepository = module.get<Repository<Soldier>>(getRepositoryToken(Soldier));
    shiftsRepository = module.get<Repository<Shift>>(getRepositoryToken(Shift));
    assignmentsRepository = module.get<Repository<ShiftAssignment>>(getRepositoryToken(ShiftAssignment));
    leaveRepository = module.get<Repository<LeaveRecord>>(getRepositoryToken(LeaveRecord));
    deploymentRepository = module.get<Repository<Deployment>>(getRepositoryToken(Deployment));
  });

  it('should reject shift when soldier has overlapping shift', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;
    const overlappingShift = {
      id: 'shift1',
      startTime: new Date('2026-01-10T10:00:00Z'),
      endTime: new Date('2026-01-10T18:00:00Z'),
    } as Shift;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([overlappingShift]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T14:00:00Z'), // Overlaps with existing shift
      endTime: new Date('2026-01-10T22:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const overlapViolations = result.violations.filter(v => v.message.includes('overlap') || v.message.includes('already assigned'));
    expect(overlapViolations.length).toBeGreaterThan(0);
    expect(overlapViolations[0].severity).toBe(ViolationSeverity.ERROR);
  });

  it('should accept shift when soldier has no overlapping shifts', async () => {
    const soldier = { id: '1', name: 'John Doe', isCommander: true } as Soldier;

    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);
    jest.spyOn(leaveRepository, 'find').mockResolvedValue([]);
    jest.spyOn(deploymentRepository, 'find').mockResolvedValue([]);
    jest.spyOn(shiftsRepository, 'createQueryBuilder').mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const input: ShiftValidationInput = {
      taskId: 'task1',
      startTime: new Date('2026-01-10T08:00:00Z'),
      endTime: new Date('2026-01-10T16:00:00Z'),
      assignments: [{ soldierId: '1', role: AssignmentRole.COMMANDER }],
    };

    const result = await service.validateShift(input);

    const overlapViolations = result.violations.filter(v => v.message.includes('overlap') || v.message.includes('already assigned'));
    expect(overlapViolations).toHaveLength(0);
  });
});
