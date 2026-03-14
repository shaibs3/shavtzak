import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let repository: Repository<Settings>;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getRepositoryToken(Settings),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    repository = module.get<Repository<Settings>>(getRepositoryToken(Settings));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('update - operational period validation', () => {
    const mockSettings = {
      id: '123',
      minBasePresence: 75,
      totalSoldiers: 20,
      operationalStartDate: null,
      operationalEndDate: null,
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockRepository.find.mockResolvedValue([mockSettings]);
    });

    it('should throw BadRequestException if only operationalStartDate is provided', async () => {
      const updateDto = {
        operationalStartDate: '2026-02-01',
      };

      await expect(service.update(updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(updateDto)).rejects.toThrow(
        'Both operationalStartDate and operationalEndDate must be provided together',
      );
    });

    it('should throw BadRequestException if only operationalEndDate is provided', async () => {
      const updateDto = {
        operationalEndDate: '2026-05-31',
      };

      await expect(service.update(updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(updateDto)).rejects.toThrow(
        'Both operationalStartDate and operationalEndDate must be provided together',
      );
    });

    it('should throw BadRequestException if operationalEndDate is before operationalStartDate', async () => {
      const updateDto = {
        operationalStartDate: '2026-05-31',
        operationalEndDate: '2026-02-01',
      };

      await expect(service.update(updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update(updateDto)).rejects.toThrow(
        'operationalEndDate must be after operationalStartDate',
      );
    });

    it('should allow valid operational period with end date after start date', async () => {
      const updateDto = {
        operationalStartDate: '2026-02-01',
        operationalEndDate: '2026-05-31',
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await expect(service.update(updateDto)).resolves.not.toThrow();

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockSettings.id,
        updateDto,
      );
    });

    it('should allow updating other settings without operational period', async () => {
      const updateDto = {
        minBasePresence: 80,
        totalSoldiers: 25,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await expect(service.update(updateDto)).resolves.not.toThrow();

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockSettings.id,
        updateDto,
      );
    });
  });
});
