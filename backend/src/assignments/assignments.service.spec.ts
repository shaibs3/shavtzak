import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';
import { SettingsService } from '../settings/settings.service';

describe('AssignmentsService - Operational Period Filtering', () => {
  let service: AssignmentsService;
  let repository: Repository<Assignment>;
  let settingsService: SettingsService;

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSettingsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: mockRepository,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    repository = module.get<Repository<Assignment>>(
      getRepositoryToken(Assignment),
    );
    settingsService = module.get<SettingsService>(SettingsService);

    jest.clearAllMocks();
  });

  describe('findAll with operational period', () => {
    it('should filter assignments by operational period when set', async () => {
      const mockSettings = {
        id: 'test-id',
        minBasePresence: 75,
        totalSoldiers: 20,
        operationalStartDate: new Date('2026-02-01'),
        operationalEndDate: new Date('2026-05-31'),
        updatedAt: new Date(),
      };

      mockSettingsService.get.mockResolvedValue(mockSettings);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll();

      // Expected end date should be adjusted to end of day
      const expectedEndDate = new Date('2026-05-31');
      expectedEndDate.setHours(23, 59, 59, 999);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'assignment',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.startTime >= :startDate',
        { startDate: mockSettings.operationalStartDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.endTime <= :endDate',
        { endDate: expectedEndDate },
      );
    });

    it('should not filter when operational period not set', async () => {
      const mockSettings = {
        id: 'test-id',
        minBasePresence: 75,
        totalSoldiers: 20,
        operationalStartDate: null,
        operationalEndDate: null,
        updatedAt: new Date(),
      };

      mockSettingsService.get.mockResolvedValue(mockSettings);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.findAll();

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith(
        'assignment',
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('create with operational period validation', () => {
    it('should allow creating assignment within operational period', async () => {
      const mockSettings = {
        id: 'test-id',
        minBasePresence: 75,
        totalSoldiers: 20,
        operationalStartDate: new Date('2026-02-01'),
        operationalEndDate: new Date('2026-05-31'),
        updatedAt: new Date(),
      };

      const createDto = {
        taskId: 'task-1',
        soldierId: 'soldier-1',
        role: 'Guard',
        startTime: new Date('2026-02-15T08:00:00Z'),
        endTime: new Date('2026-02-15T16:00:00Z'),
        locked: false,
      };

      mockSettingsService.get.mockResolvedValue(mockSettings);
      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue({ ...createDto, id: 'new-id' });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should reject creating assignment outside operational period', async () => {
      const mockSettings = {
        id: 'test-id',
        minBasePresence: 75,
        totalSoldiers: 20,
        operationalStartDate: new Date('2026-02-01'),
        operationalEndDate: new Date('2026-05-31'),
        updatedAt: new Date(),
      };

      const createDto = {
        taskId: 'task-1',
        soldierId: 'soldier-1',
        role: 'Guard',
        startTime: new Date('2026-06-15T08:00:00Z'), // Outside period
        endTime: new Date('2026-06-15T16:00:00Z'),
        locked: false,
      };

      mockSettingsService.get.mockResolvedValue(mockSettings);

      await expect(service.create(createDto)).rejects.toThrow(
        'Assignment must be within the operational period',
      );
    });

    it('should allow creating assignment when no operational period set', async () => {
      const mockSettings = {
        id: 'test-id',
        minBasePresence: 75,
        totalSoldiers: 20,
        operationalStartDate: null,
        operationalEndDate: null,
        updatedAt: new Date(),
      };

      const createDto = {
        taskId: 'task-1',
        soldierId: 'soldier-1',
        role: 'Guard',
        startTime: new Date('2026-06-15T08:00:00Z'),
        endTime: new Date('2026-06-15T16:00:00Z'),
        locked: false,
      };

      mockSettingsService.get.mockResolvedValue(mockSettings);
      mockRepository.create.mockReturnValue(createDto);
      mockRepository.save.mockResolvedValue({ ...createDto, id: 'new-id' });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
