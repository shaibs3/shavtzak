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
    repository = module.get<Repository<Assignment>>(getRepositoryToken(Assignment));
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

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('assignment');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.startTime >= :startDate',
        { startDate: mockSettings.operationalStartDate },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'assignment.endTime <= :endDate',
        { endDate: mockSettings.operationalEndDate },
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

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('assignment');
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });
});
