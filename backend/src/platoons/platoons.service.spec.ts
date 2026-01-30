import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PlatoonsService } from './platoons.service';
import { Platoon } from './entities/platoon.entity';
import { Soldier } from '../soldiers/entities/soldier.entity';

describe('PlatoonsService', () => {
  let service: PlatoonsService;
  let platoonRepo: Repository<Platoon>;
  let soldierRepo: Repository<Soldier>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatoonsService,
        {
          provide: getRepositoryToken(Platoon),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Soldier),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlatoonsService>(PlatoonsService);
    platoonRepo = module.get<Repository<Platoon>>(getRepositoryToken(Platoon));
    soldierRepo = module.get<Repository<Soldier>>(getRepositoryToken(Soldier));
  });

  describe('create', () => {
    it('should create platoon with auto-assigned color', async () => {
      const createDto = { name: 'מחלקה א\'', commander: 'רס״ן כהן' };
      jest.spyOn(platoonRepo, 'find').mockResolvedValue([]);
      jest.spyOn(platoonRepo, 'create').mockReturnValue({ ...createDto, color: '#3B82F6' } as any);
      jest.spyOn(platoonRepo, 'save').mockResolvedValue({ id: '1', ...createDto, color: '#3B82F6' } as any);

      const result = await service.create(createDto);

      expect(result.color).toBe('#3B82F6');
      expect(platoonRepo.find).toHaveBeenCalled();
    });

    it('should cycle colors after 10 platoons', async () => {
      const createDto = { name: 'מחלקה יא' };
      const mockPlatoons = Array(10).fill(null).map((_, i) => ({ id: `${i + 1}` }));
      jest.spyOn(platoonRepo, 'find').mockResolvedValue(mockPlatoons as any);
      jest.spyOn(platoonRepo, 'create').mockReturnValue({ ...createDto, color: '#3B82F6' } as any);
      jest.spyOn(platoonRepo, 'save').mockResolvedValue({ id: '11', ...createDto, color: '#3B82F6' } as any);

      const result = await service.create(createDto);

      expect(result.color).toBe('#3B82F6'); // Same as first color
    });
  });

  describe('remove', () => {
    it('should throw ConflictException if platoon has soldiers', async () => {
      const platoon = {
        id: '1',
        name: 'מחלקה א\'',
        soldiers: [{ id: 's1' }] as any
      };
      jest.spyOn(platoonRepo, 'findOne').mockResolvedValue(platoon as any);

      await expect(service.remove('1')).rejects.toThrow(ConflictException);
    });

    it('should delete platoon if no soldiers', async () => {
      const platoon = { id: '1', name: 'מחלקה א\'', soldiers: [] };
      jest.spyOn(platoonRepo, 'findOne').mockResolvedValue(platoon as any);
      jest.spyOn(platoonRepo, 'remove').mockResolvedValue(platoon as any);

      await service.remove('1');

      expect(platoonRepo.remove).toHaveBeenCalledWith(platoon);
    });
  });

  describe('autoAssign', () => {
    it('should distribute soldiers round-robin', async () => {
      const platoons = [
        { id: 'p1', name: 'מחלקה א\'' },
        { id: 'p2', name: 'מחלקה ב\'' },
      ];
      const soldiers = [
        { id: 's1', platoonId: null },
        { id: 's2', platoonId: null },
        { id: 's3', platoonId: null },
      ] as any[];

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(platoons[0] as any)
        .mockResolvedValueOnce(platoons[1] as any);
      jest.spyOn(soldierRepo, 'find').mockResolvedValue(soldiers);
      jest.spyOn(soldierRepo, 'save').mockResolvedValue(soldiers as any);

      const result = await service.autoAssign(['p1', 'p2']);

      expect(result.assignedCount).toBe(3);
      expect(soldiers[0].platoonId).toBe('p1');
      expect(soldiers[1].platoonId).toBe('p2');
      expect(soldiers[2].platoonId).toBe('p1');
    });

    it('should return 0 if no soldiers without platoon', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'p1' } as any);
      jest.spyOn(soldierRepo, 'find').mockResolvedValue([]);

      const result = await service.autoAssign(['p1']);

      expect(result.assignedCount).toBe(0);
      expect(soldierRepo.save).not.toHaveBeenCalled();
    });
  });
});
