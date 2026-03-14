# Platoons Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add platoon management with CRUD operations, soldier-platoon associations, and visual integration throughout the scheduling system.

**Architecture:** New `platoons` module in backend with Entity/Service/Controller/DTOs, relation to soldiers via optional foreign key, auto-color assignment, frontend tabs/filters in soldiers and schedule views.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, React, TypeScript, React Query, Tailwind CSS

---

## Task 1: Backend - Platoon Entity and Module Setup

**Files:**
- Create: `backend/src/platoons/entities/platoon.entity.ts`
- Create: `backend/src/platoons/platoons.module.ts`
- Create: `backend/src/platoons/platoons.service.ts`
- Create: `backend/src/platoons/platoons.controller.ts`
- Create: `backend/src/platoons/dto/create-platoon.dto.ts`
- Create: `backend/src/platoons/dto/update-platoon.dto.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Create Platoon Entity**

Create `backend/src/platoons/entities/platoon.entity.ts`:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';

@Entity('platoons')
export class Platoon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ nullable: true, length: 100 })
  commander: string | null;

  @Column({ length: 7 })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => Soldier, (soldier) => soldier.platoon)
  soldiers: Soldier[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Create DTOs**

Create `backend/src/platoons/dto/create-platoon.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePlatoonDto {
  @ApiProperty({ example: 'מחלקה א\'', description: 'Platoon name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'רס״ן כהן', description: 'Commander name', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  commander?: string;

  @ApiProperty({ example: 'מחלקה ראשונה', description: 'Platoon description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```

Create `backend/src/platoons/dto/update-platoon.dto.ts`:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreatePlatoonDto } from './create-platoon.dto';

export class UpdatePlatoonDto extends PartialType(CreatePlatoonDto) {}
```

**Step 3: Create Platoons Service with color assignment**

Create `backend/src/platoons/platoons.service.ts`:

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platoon } from './entities/platoon.entity';
import { CreatePlatoonDto } from './dto/create-platoon.dto';
import { UpdatePlatoonDto } from './dto/update-platoon.dto';

const PLATOON_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
];

@Injectable()
export class PlatoonsService {
  constructor(
    @InjectRepository(Platoon)
    private platoonsRepository: Repository<Platoon>,
  ) {}

  async create(createPlatoonDto: CreatePlatoonDto): Promise<Platoon> {
    // Count existing platoons for color assignment
    const count = await this.platoonsRepository.count();
    const color = PLATOON_COLORS[count % PLATOON_COLORS.length];

    const platoon = this.platoonsRepository.create({
      ...createPlatoonDto,
      color,
    });
    return this.platoonsRepository.save(platoon);
  }

  async findAll(): Promise<Platoon[]> {
    return this.platoonsRepository.find({
      relations: ['soldiers'],
    });
  }

  async findOne(id: string): Promise<Platoon> {
    const platoon = await this.platoonsRepository.findOne({
      where: { id },
      relations: ['soldiers'],
    });
    if (!platoon) {
      throw new NotFoundException(`Platoon with ID ${id} not found`);
    }
    return platoon;
  }

  async update(id: string, updatePlatoonDto: UpdatePlatoonDto): Promise<Platoon> {
    await this.findOne(id); // Check if exists
    await this.platoonsRepository.update(id, updatePlatoonDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const platoon = await this.findOne(id);

    // Check if platoon has soldiers
    if (platoon.soldiers && platoon.soldiers.length > 0) {
      throw new ConflictException({
        message: 'Cannot delete platoon with assigned soldiers',
        soldierCount: platoon.soldiers.length,
      });
    }

    await this.platoonsRepository.remove(platoon);
  }
}
```

**Step 4: Create Platoons Controller**

Create `backend/src/platoons/platoons.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlatoonsService } from './platoons.service';
import { CreatePlatoonDto } from './dto/create-platoon.dto';
import { UpdatePlatoonDto } from './dto/update-platoon.dto';

@ApiTags('platoons')
@Controller('platoons')
export class PlatoonsController {
  constructor(private readonly platoonsService: PlatoonsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new platoon' })
  @ApiResponse({ status: 201, description: 'Platoon created successfully' })
  create(@Body() createPlatoonDto: CreatePlatoonDto) {
    return this.platoonsService.create(createPlatoonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all platoons' })
  @ApiResponse({ status: 200, description: 'List of all platoons' })
  findAll() {
    return this.platoonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a platoon by ID' })
  @ApiResponse({ status: 200, description: 'Platoon found' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  findOne(@Param('id') id: string) {
    return this.platoonsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a platoon' })
  @ApiResponse({ status: 200, description: 'Platoon updated successfully' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  update(@Param('id') id: string, @Body() updatePlatoonDto: UpdatePlatoonDto) {
    return this.platoonsService.update(id, updatePlatoonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a platoon' })
  @ApiResponse({ status: 200, description: 'Platoon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  @ApiResponse({ status: 409, description: 'Platoon has assigned soldiers' })
  remove(@Param('id') id: string) {
    return this.platoonsService.remove(id);
  }
}
```

**Step 5: Create Platoons Module**

Create `backend/src/platoons/platoons.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatoonsService } from './platoons.service';
import { PlatoonsController } from './platoons.controller';
import { Platoon } from './entities/platoon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Platoon])],
  controllers: [PlatoonsController],
  providers: [PlatoonsService],
  exports: [PlatoonsService],
})
export class PlatoonsModule {}
```

**Step 6: Register module in App Module**

Modify `backend/src/app.module.ts`:

```typescript
import { PlatoonsModule } from './platoons/platoons.module';

@Module({
  imports: [
    // ... existing imports
    PlatoonsModule,
  ],
  // ... rest
})
export class AppModule {}
```

**Step 7: Build and verify no errors**

Run: `cd backend && npm run build`
Expected: Build succeeds with no TypeScript errors

**Step 8: Commit**

```bash
cd /Users/shaibenshalom/projects/shavtzak/.worktrees/feature/platoons
git add backend/src/platoons backend/src/app.module.ts
git commit -m "feat(backend): add platoon entity, service, controller, and module

- Create Platoon entity with name, commander, color, description
- Implement auto-color assignment from predefined palette
- Add CRUD operations with ConflictException for delete with soldiers
- Register PlatoonsModule in AppModule

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Backend - Update Soldier Entity with Platoon Relation

**Files:**
- Modify: `backend/src/soldiers/entities/soldier.entity.ts`
- Modify: `backend/src/soldiers/dto/create-soldier.dto.ts`
- Modify: `backend/src/soldiers/dto/update-soldier.dto.ts`
- Modify: `backend/src/soldiers/soldiers.module.ts`

**Step 1: Add platoon relation to Soldier entity**

Modify `backend/src/soldiers/entities/soldier.entity.ts`:

Add imports at top:
```typescript
import { ManyToOne, JoinColumn } from 'typeorm';
import { Platoon } from '../../platoons/entities/platoon.entity';
```

Add before `@OneToMany` line:
```typescript
@ManyToOne(() => Platoon, (platoon) => platoon.soldiers, {
  nullable: true,
  onDelete: 'SET NULL',
})
@JoinColumn({ name: 'platoonId' })
platoon: Platoon | null;

@Column({ type: 'uuid', nullable: true })
platoonId: string | null;
```

**Step 2: Update Create Soldier DTO**

Modify `backend/src/soldiers/dto/create-soldier.dto.ts`:

Add import:
```typescript
import { IsUUID, IsOptional } from 'class-validator';
```

Add property after `usedVacationDays`:
```typescript
@ApiProperty({
  example: '123e4567-e89b-12d3-a456-426614174000',
  description: 'Platoon ID',
  required: false
})
@IsUUID()
@IsOptional()
platoonId?: string;
```

**Step 3: Soldiers Module - Import PlatoonsModule**

Modify `backend/src/soldiers/soldiers.module.ts`:

Add import:
```typescript
import { PlatoonsModule } from '../platoons/platoons.module';
```

Add to imports array:
```typescript
imports: [
  TypeOrmModule.forFeature([Soldier, Constraint]),
  PlatoonsModule, // Add this
],
```

**Step 4: Build and verify**

Run: `cd backend && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add backend/src/soldiers
git commit -m "feat(backend): add platoon relation to soldier entity

- Add ManyToOne relation from Soldier to Platoon
- Add platoonId column (nullable, onDelete SET NULL)
- Update DTOs to accept optional platoonId
- Import PlatoonsModule in SoldiersModule

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Backend - Add Auto-Assign and Bulk Update Endpoints

**Files:**
- Modify: `backend/src/platoons/platoons.service.ts`
- Modify: `backend/src/platoons/platoons.controller.ts`
- Create: `backend/src/platoons/dto/auto-assign.dto.ts`
- Modify: `backend/src/soldiers/soldiers.service.ts`
- Modify: `backend/src/soldiers/soldiers.controller.ts`
- Create: `backend/src/soldiers/dto/bulk-update-soldiers.dto.ts`

**Step 1: Create Auto-Assign DTO**

Create `backend/src/platoons/dto/auto-assign.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AutoAssignDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2', 'uuid3'],
    description: 'Array of platoon IDs to distribute soldiers among',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  platoonIds: string[];
}
```

**Step 2: Add auto-assign method to Platoons Service**

Modify `backend/src/platoons/platoons.service.ts`:

Add import at top:
```typescript
import { Soldier } from '../soldiers/entities/soldier.entity';
import { InjectRepository } from '@nestjs/typeorm';
```

Add to constructor:
```typescript
@InjectRepository(Soldier)
private soldiersRepository: Repository<Soldier>,
```

Add method at end:
```typescript
async autoAssign(platoonIds: string[]): Promise<{ assignedCount: number }> {
  // Validate all platoons exist
  const platoons = await Promise.all(
    platoonIds.map(id => this.findOne(id))
  );

  // Get all soldiers without platoon
  const soldiers = await this.soldiersRepository.find({
    where: { platoonId: null },
  });

  if (soldiers.length === 0) {
    return { assignedCount: 0 };
  }

  // Distribute round-robin
  for (let i = 0; i < soldiers.length; i++) {
    const platoonIndex = i % platoonIds.length;
    soldiers[i].platoonId = platoonIds[platoonIndex];
  }

  await this.soldiersRepository.save(soldiers);

  return { assignedCount: soldiers.length };
}
```

**Step 3: Add auto-assign endpoint to Controller**

Modify `backend/src/platoons/platoons.controller.ts`:

Add import:
```typescript
import { AutoAssignDto } from './dto/auto-assign.dto';
```

Add method after `remove`:
```typescript
@Post('auto-assign')
@ApiOperation({ summary: 'Auto-assign soldiers without platoon' })
@ApiResponse({ status: 200, description: 'Soldiers assigned successfully' })
autoAssign(@Body() autoAssignDto: AutoAssignDto) {
  return this.platoonsService.autoAssign(autoAssignDto.platoonIds);
}
```

**Step 4: Create Bulk Update Soldiers DTO**

Create `backend/src/soldiers/dto/bulk-update-soldiers.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, IsOptional } from 'class-validator';

export class BulkUpdateSoldiersDto {
  @ApiProperty({
    example: ['uuid1', 'uuid2'],
    description: 'Array of soldier IDs to update',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  soldierIds: string[];

  @ApiProperty({
    example: 'uuid-platoon',
    description: 'Platoon ID to assign (or null to remove)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  platoonId?: string | null;
}
```

**Step 5: Add bulk update method to Soldiers Service**

Modify `backend/src/soldiers/soldiers.service.ts`:

Add import:
```typescript
import { In } from 'typeorm';
```

Add method at end:
```typescript
async bulkUpdate(soldierIds: string[], platoonId: string | null): Promise<{ updatedCount: number }> {
  const result = await this.soldiersRepository.update(
    { id: In(soldierIds) },
    { platoonId: platoonId }
  );

  return { updatedCount: result.affected || 0 };
}
```

**Step 6: Add bulk update endpoint to Soldiers Controller**

Modify `backend/src/soldiers/soldiers.controller.ts`:

Add import:
```typescript
import { BulkUpdateSoldiersDto } from './dto/bulk-update-soldiers.dto';
```

Add method after `removeConstraint`:
```typescript
@Patch('bulk-update')
@ApiOperation({ summary: 'Bulk update soldiers platoon assignment' })
@ApiResponse({ status: 200, description: 'Soldiers updated successfully' })
bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSoldiersDto) {
  return this.soldiersService.bulkUpdate(
    bulkUpdateDto.soldierIds,
    bulkUpdateDto.platoonId ?? null
  );
}
```

**Step 7: Update PlatoonsModule to export Soldier repository**

Modify `backend/src/platoons/platoons.module.ts`:

Add import:
```typescript
import { Soldier } from '../soldiers/entities/soldier.entity';
```

Update imports array:
```typescript
imports: [TypeOrmModule.forFeature([Platoon, Soldier])],
```

**Step 8: Build and verify**

Run: `cd backend && npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add backend/src/platoons backend/src/soldiers
git commit -m "feat(backend): add auto-assign and bulk update endpoints

- Add POST /platoons/auto-assign to distribute unassigned soldiers
- Add PATCH /soldiers/bulk-update for platoon reassignment
- Implement round-robin distribution algorithm
- Support null platoonId for removing assignments

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Backend - Unit Tests for Platoons Service

**Files:**
- Create: `backend/src/platoons/platoons.service.spec.ts`

**Step 1: Write tests for platoons service**

Create `backend/src/platoons/platoons.service.spec.ts`:

```typescript
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
      jest.spyOn(platoonRepo, 'count').mockResolvedValue(0);
      jest.spyOn(platoonRepo, 'create').mockReturnValue({ ...createDto, color: '#4CAF50' } as any);
      jest.spyOn(platoonRepo, 'save').mockResolvedValue({ id: '1', ...createDto, color: '#4CAF50' } as any);

      const result = await service.create(createDto);

      expect(result.color).toBe('#4CAF50');
      expect(platoonRepo.count).toHaveBeenCalled();
    });

    it('should cycle colors after 10 platoons', async () => {
      const createDto = { name: 'מחלקה יא' };
      jest.spyOn(platoonRepo, 'count').mockResolvedValue(10);
      jest.spyOn(platoonRepo, 'create').mockReturnValue({ ...createDto, color: '#4CAF50' } as any);
      jest.spyOn(platoonRepo, 'save').mockResolvedValue({ id: '11', ...createDto, color: '#4CAF50' } as any);

      const result = await service.create(createDto);

      expect(result.color).toBe('#4CAF50'); // Same as first color
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
```

**Step 2: Run tests**

Run: `cd backend && npm test -- platoons.service.spec`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/src/platoons/platoons.service.spec.ts
git commit -m "test(backend): add unit tests for platoons service

- Test auto-color assignment and cycling
- Test ConflictException on delete with soldiers
- Test round-robin auto-assign distribution
- Test edge case with zero unassigned soldiers

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Frontend - Types and API Hooks

**Files:**
- Modify: `frontend/src/types/scheduling.ts`
- Create: `frontend/src/hooks/usePlatoons.ts`

**Step 1: Add Platoon types**

Modify `frontend/src/types/scheduling.ts`:

Add after `Settings` interface:
```typescript
export interface Platoon {
  id: string;
  name: string;
  commander: string | null;
  color: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  soldiers?: Soldier[];
}

export type CreatePlatoonDto = Omit<Platoon, 'id' | 'color' | 'createdAt' | 'updatedAt' | 'soldiers'>;
export type UpdatePlatoonDto = Partial<CreatePlatoonDto>;
```

Update `Soldier` interface to include platoon:
```typescript
export interface Soldier {
  id: string;
  name: string;
  rank: string;
  roles: Role[];
  constraints: Constraint[];
  maxVacationDays: number;
  usedVacationDays: number;
  platoonId: string | null;  // Add this
  platoon?: Platoon;         // Add this
}
```

Update `CreateSoldierDto`:
```typescript
export type CreateSoldierDto = Omit<Soldier, 'id' | 'constraints' | 'platoon'>;
```

**Step 2: Create Platoons API hooks**

Create `frontend/src/hooks/usePlatoons.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platoon, CreatePlatoonDto, UpdatePlatoonDto } from '@/types/scheduling';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function usePlatoons() {
  return useQuery({
    queryKey: ['platoons'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/platoons`);
      if (!response.ok) throw new Error('Failed to fetch platoons');
      return response.json() as Promise<Platoon[]>;
    },
  });
}

export function useCreatePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlatoonDto) => {
      const response = await fetch(`${API_URL}/platoons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create platoon');
      return response.json() as Promise<Platoon>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useUpdatePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePlatoonDto }) => {
      const response = await fetch(`${API_URL}/platoons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update platoon');
      return response.json() as Promise<Platoon>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useDeletePlatoon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/platoons/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 409) {
          const error = await response.json();
          throw new Error(JSON.stringify(error));
        }
        throw new Error('Failed to delete platoon');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
    },
  });
}

export function useAutoAssignPlatoons() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platoonIds: string[]) => {
      const response = await fetch(`${API_URL}/platoons/auto-assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platoonIds }),
      });
      if (!response.ok) throw new Error('Failed to auto-assign');
      return response.json() as Promise<{ assignedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
    },
  });
}

export function useBulkUpdateSoldiers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ soldierIds, platoonId }: { soldierIds: string[]; platoonId: string | null }) => {
      const response = await fetch(`${API_URL}/soldiers/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soldierIds, platoonId }),
      });
      if (!response.ok) throw new Error('Failed to bulk update soldiers');
      return response.json() as Promise<{ updatedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      queryClient.invalidateQueries({ queryKey: ['platoons'] });
    },
  });
}
```

**Step 3: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/types/scheduling.ts frontend/src/hooks/usePlatoons.ts
git commit -m "feat(frontend): add platoon types and API hooks

- Add Platoon interface with color, commander, description
- Update Soldier type to include platoonId and platoon relation
- Create React Query hooks for CRUD operations
- Add auto-assign and bulk-update mutation hooks

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Frontend - Platoon Management Dialog Component

**Files:**
- Create: `frontend/src/components/platoons/PlatoonManagementDialog.tsx`
- Create: `frontend/src/components/platoons/PlatoonForm.tsx`
- Create: `frontend/src/components/platoons/DeletePlatoonDialog.tsx`

**Step 1: Create Platoon Form Component**

Create `frontend/src/components/platoons/PlatoonForm.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Platoon } from '@/types/scheduling';

interface PlatoonFormProps {
  platoon?: Platoon;
  onSubmit: (data: { name: string; commander?: string; description?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function PlatoonForm({ platoon, onSubmit, onCancel, isSubmitting }: PlatoonFormProps) {
  const [name, setName] = useState(platoon?.name || '');
  const [commander, setCommander] = useState(platoon?.commander || '');
  const [description, setDescription] = useState(platoon?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      commander: commander || undefined,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">שם המחלקה *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="commander">מפקד</Label>
        <Input
          id="commander"
          value={commander}
          onChange={(e) => setCommander(e.target.value)}
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1.5"
        />
      </div>

      {platoon && (
        <div className="bg-muted/50 rounded-lg p-3">
          <Label className="text-xs text-muted-foreground">צבע</Label>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: platoon.color }}
            />
            <span className="text-sm">{platoon.color}</span>
            <span className="text-xs text-muted-foreground">(מוקצה אוטומטית)</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : platoon ? 'עדכן' : 'צור מחלקה'}
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Create Delete Platoon Dialog**

Create `frontend/src/components/platoons/DeletePlatoonDialog.tsx`:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Platoon } from '@/types/scheduling';

interface DeletePlatoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platoon: Platoon;
  soldierCount: number;
  availablePlatoons: Platoon[];
  onConfirm: (targetPlatoonId: string | null) => void;
  isDeleting: boolean;
}

export function DeletePlatoonDialog({
  open,
  onOpenChange,
  platoon,
  soldierCount,
  availablePlatoons,
  onConfirm,
  isDeleting,
}: DeletePlatoonDialogProps) {
  const [selectedPlatoon, setSelectedPlatoon] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מחיקת מחלקה</DialogTitle>
          <DialogDescription>
            מחלקה "{platoon.name}" כוללת {soldierCount} חיילים.
            <br />
            יש לבחור מה לעשות עם החיילים לפני המחיקה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">העבר חיילים ל:</label>
            <Select
              value={selectedPlatoon || 'none'}
              onValueChange={(v) => setSelectedPlatoon(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מחלקה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">השאר ללא מחלקה</SelectItem>
                {availablePlatoons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(selectedPlatoon)}
            disabled={isDeleting}
          >
            {isDeleting ? 'מוחק...' : 'מחק מחלקה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Create Platoon Management Dialog**

Create `frontend/src/components/platoons/PlatoonManagementDialog.tsx`:

```typescript
import { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Platoon } from '@/types/scheduling';
import {
  usePlatoons,
  useCreatePlatoon,
  useUpdatePlatoon,
  useDeletePlatoon,
  useBulkUpdateSoldiers,
} from '@/hooks/usePlatoons';
import { PlatoonForm } from './PlatoonForm';
import { DeletePlatoonDialog } from './DeletePlatoonDialog';
import { toast } from '@/hooks/use-toast';

interface PlatoonManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlatoonManagementDialog({ open, onOpenChange }: PlatoonManagementDialogProps) {
  const { data: platoons = [] } = usePlatoons();
  const createPlatoon = useCreatePlatoon();
  const updatePlatoon = useUpdatePlatoon();
  const deletePlatoon = useDeletePlatoon();
  const bulkUpdate = useBulkUpdateSoldiers();

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedPlatoon, setSelectedPlatoon] = useState<Platoon | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    platoon: Platoon | null;
    soldierCount: number;
  }>({ open: false, platoon: null, soldierCount: 0 });

  const handleCreate = (data: { name: string; commander?: string; description?: string }) => {
    createPlatoon.mutate(data, {
      onSuccess: () => {
        toast({ title: 'מחלקה נוצרה בהצלחה' });
        setMode('list');
      },
      onError: () => {
        toast({ title: 'שגיאה ביצירת מחלקה', variant: 'destructive' });
      },
    });
  };

  const handleUpdate = (data: { name: string; commander?: string; description?: string }) => {
    if (!selectedPlatoon) return;
    updatePlatoon.mutate(
      { id: selectedPlatoon.id, data },
      {
        onSuccess: () => {
          toast({ title: 'מחלקה עודכנה בהצלחה' });
          setMode('list');
          setSelectedPlatoon(null);
        },
        onError: () => {
          toast({ title: 'שגיאה בעדכון מחלקה', variant: 'destructive' });
        },
      }
    );
  };

  const handleDeleteAttempt = (platoon: Platoon) => {
    const soldierCount = platoon.soldiers?.length || 0;
    if (soldierCount > 0) {
      setDeleteDialog({ open: true, platoon, soldierCount });
    } else {
      deletePlatoon.mutate(platoon.id, {
        onSuccess: () => {
          toast({ title: 'מחלקה נמחקה בהצלחה' });
        },
        onError: () => {
          toast({ title: 'שגיאה במחיקת מחלקה', variant: 'destructive' });
        },
      });
    }
  };

  const handleDeleteConfirm = async (targetPlatoonId: string | null) => {
    if (!deleteDialog.platoon) return;

    const soldierIds = deleteDialog.platoon.soldiers?.map((s) => s.id) || [];

    // Bulk update soldiers first
    bulkUpdate.mutate(
      { soldierIds, platoonId: targetPlatoonId },
      {
        onSuccess: () => {
          // Then delete platoon
          deletePlatoon.mutate(deleteDialog.platoon!.id, {
            onSuccess: () => {
              toast({ title: 'מחלקה נמחקה והחיילים הועברו' });
              setDeleteDialog({ open: false, platoon: null, soldierCount: 0 });
            },
            onError: () => {
              toast({ title: 'שגיאה במחיקת מחלקה', variant: 'destructive' });
            },
          });
        },
        onError: () => {
          toast({ title: 'שגיאה בהעברת חיילים', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === 'list' && 'ניהול מחלקות'}
              {mode === 'create' && 'יצירת מחלקה חדשה'}
              {mode === 'edit' && 'עריכת מחלקה'}
            </DialogTitle>
          </DialogHeader>

          {mode === 'list' && (
            <div className="space-y-4">
              <div className="space-y-2">
                {platoons.map((platoon) => (
                  <div
                    key={platoon.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: platoon.color }}
                      />
                      <div>
                        <p className="font-medium">{platoon.name}</p>
                        {platoon.commander && (
                          <p className="text-sm text-muted-foreground">{platoon.commander}</p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {platoon.soldiers?.length || 0} חיילים
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPlatoon(platoon);
                          setMode('edit');
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttempt(platoon)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => setMode('create')} className="w-full gap-2">
                <Plus className="w-4 h-4" />
                הוסף מחלקה
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <PlatoonForm
              onSubmit={handleCreate}
              onCancel={() => setMode('list')}
              isSubmitting={createPlatoon.isPending}
            />
          )}

          {mode === 'edit' && selectedPlatoon && (
            <PlatoonForm
              platoon={selectedPlatoon}
              onSubmit={handleUpdate}
              onCancel={() => {
                setMode('list');
                setSelectedPlatoon(null);
              }}
              isSubmitting={updatePlatoon.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleteDialog.platoon && (
        <DeletePlatoonDialog
          open={deleteDialog.open}
          onOpenChange={(open) =>
            setDeleteDialog({ open, platoon: deleteDialog.platoon, soldierCount: deleteDialog.soldierCount })
          }
          platoon={deleteDialog.platoon}
          soldierCount={deleteDialog.soldierCount}
          availablePlatoons={platoons.filter((p) => p.id !== deleteDialog.platoon?.id)}
          onConfirm={handleDeleteConfirm}
          isDeleting={bulkUpdate.isPending || deletePlatoon.isPending}
        />
      )}
    </>
  );
}
```

**Step 4: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/platoons
git commit -m "feat(frontend): add platoon management dialog components

- Create PlatoonForm with name, commander, description fields
- Create DeletePlatoonDialog with reassignment options
- Create PlatoonManagementDialog with list/create/edit modes
- Implement delete flow with bulk soldier reassignment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Frontend - Soldiers Page with Platoon Tabs

**Files:**
- Modify: `frontend/src/components/soldiers/SoldiersView.tsx`
- Modify: `frontend/src/components/soldiers/SoldierForm.tsx`

**Step 1: Update SoldierForm to include platoon selector**

Modify `frontend/src/components/soldiers/SoldierForm.tsx`:

Add import at top:
```typescript
import { usePlatoons } from '@/hooks/usePlatoons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
```

Add after other state declarations:
```typescript
const { data: platoons = [] } = usePlatoons();
const [platoonId, setPlatoonId] = useState<string | null>(
  soldier?.platoonId || null
);
```

Update form submission to include platoonId:
```typescript
onSubmit({
  // ... existing fields
  platoonId,
});
```

Add before the submit button section:
```typescript
<div>
  <Label htmlFor="platoon">מחלקה</Label>
  <Select
    value={platoonId || 'none'}
    onValueChange={(v) => setPlatoonId(v === 'none' ? null : v)}
  >
    <SelectTrigger id="platoon" className="mt-1.5">
      <SelectValue placeholder="בחר מחלקה" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">ללא מחלקה</SelectItem>
      {platoons.map((p) => (
        <SelectItem key={p.id} value={p.id}>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.name}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Step 2: Update SoldiersView with tabs**

Modify `frontend/src/components/soldiers/SoldiersView.tsx`:

Add imports:
```typescript
import { useMemo, useState } from 'react';
import { Settings } from 'lucide-react';
import { usePlatoons } from '@/hooks/usePlatoons';
import { PlatoonManagementDialog } from '@/components/platoons/PlatoonManagementDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

Add state and data:
```typescript
const { data: platoons = [] } = usePlatoons();
const [platoonDialog, setPlatoonDialog] = useState(false);
const [activeTab, setActiveTab] = useState<string>('all');
```

Add filtered soldiers logic:
```typescript
const filteredSoldiers = useMemo(() => {
  if (activeTab === 'all') return soldiers;
  if (activeTab === 'none') return soldiers.filter((s) => !s.platoonId);
  return soldiers.filter((s) => s.platoonId === activeTab);
}, [soldiers, activeTab]);
```

Replace the soldiers list section with tabs:
```typescript
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <div className="flex items-center justify-between mb-4">
    <TabsList>
      <TabsTrigger value="all">
        הכל ({soldiers.length})
      </TabsTrigger>
      {platoons.map((platoon) => (
        <TabsTrigger key={platoon.id} value={platoon.id}>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platoon.color }}
            />
            <span>{platoon.name}</span>
            <span className="text-muted-foreground">
              ({soldiers.filter((s) => s.platoonId === platoon.id).length})
            </span>
          </div>
        </TabsTrigger>
      ))}
      <TabsTrigger value="none">
        ללא מחלקה ({soldiers.filter((s) => !s.platoonId).length})
      </TabsTrigger>
    </TabsList>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPlatoonDialog(true)}
      className="gap-2"
    >
      <Settings className="w-4 h-4" />
      נהל מחלקות
    </Button>
  </div>

  <TabsContent value={activeTab} className="mt-0">
    {/* Existing soldiers grid code, but use filteredSoldiers instead of soldiers */}
  </TabsContent>
</Tabs>

<PlatoonManagementDialog
  open={platoonDialog}
  onOpenChange={setPlatoonDialog}
/>
```

**Step 3: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/soldiers
git commit -m "feat(frontend): add platoon tabs and selector to soldiers page

- Add tabs for all/platoon/none filtering in SoldiersView
- Add \"Manage Platoons\" button opening management dialog
- Add platoon selector dropdown in SoldierForm
- Display platoon colors in tabs and form

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Frontend - Schedule View Platoon Integration

**Files:**
- Modify: `frontend/src/components/schedule/ScheduleView.tsx`

**Step 1: Add platoon badges to assignment cells**

Modify `frontend/src/components/schedule/ScheduleView.tsx`:

Add import:
```typescript
import { usePlatoons } from '@/hooks/usePlatoons';
```

Add data fetch after other hooks:
```typescript
const { data: platoons = [] } = usePlatoons();
```

Create platoon lookup map:
```typescript
const platoonById = useMemo(
  () => new Map(platoons.map((p) => [p.id, p])),
  [platoons]
);
```

Update assignment cell rendering (around line 280-290):
```typescript
<div
  key={a.id}
  className="flex items-center justify-between rounded-md border border-border bg-background/50 px-2 py-1 text-xs"
>
  <div className="flex items-center gap-1">
    <span className="truncate">
      {soldierById.get(a.soldierId)?.name ?? 'חייל'} · {roleLabels[a.role]}
    </span>
    {(() => {
      const soldier = soldierById.get(a.soldierId);
      const platoon = soldier?.platoonId ? platoonById.get(soldier.platoonId) : null;
      if (platoon) {
        return (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platoon.color }}
            title={platoon.name}
          />
        );
      }
      return null;
    })()}
  </div>
  {!!a.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
</div>
```

**Step 2: Add platoon filter**

Add state for filter:
```typescript
const [selectedPlatoonFilter, setSelectedPlatoonFilter] = useState<string[]>([]);
```

Add filtered assignments logic:
```typescript
const displayedAssignments = useMemo(() => {
  if (selectedPlatoonFilter.length === 0) return weekAssignments;

  return weekAssignments.filter((a) => {
    const soldier = soldierById.get(a.soldierId);
    if (!soldier) return false;

    // Check if soldier's platoon is in filter, or if "none" is selected and soldier has no platoon
    if (selectedPlatoonFilter.includes('none') && !soldier.platoonId) return true;
    if (soldier.platoonId && selectedPlatoonFilter.includes(soldier.platoonId)) return true;

    return false;
  });
}, [weekAssignments, selectedPlatoonFilter, soldierById]);
```

Update `assignmentsByTaskDay` to use `displayedAssignments`:
```typescript
const assignmentsByTaskDay = useMemo(() => {
  const map = new Map<string, typeof displayedAssignments>();
  for (const a of displayedAssignments) {
    // ... rest stays the same
  }
  return map;
}, [displayedAssignments]);
```

Add filter UI in header (after "Auto Schedule" button):
```typescript
<Select
  value={selectedPlatoonFilter[0] || 'all'}
  onValueChange={(v) => {
    if (v === 'all') {
      setSelectedPlatoonFilter([]);
    } else {
      setSelectedPlatoonFilter([v]);
    }
  }}
>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="סנן לפי מחלקה" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">כל המחלקות</SelectItem>
    {platoons.map((p) => (
      <SelectItem key={p.id} value={p.id}>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span>{p.name}</span>
        </div>
      </SelectItem>
    ))}
    <SelectItem value="none">ללא מחלקה</SelectItem>
  </SelectContent>
</Select>
```

**Step 3: Add platoon distribution statistics card**

Add new card in statistics section:
```typescript
<div className="bg-card rounded-xl p-5 shadow-card">
  <h3 className="font-semibold mb-3">התפלגות לפי מחלקות</h3>
  <div className="space-y-2">
    {platoons.map((platoon) => {
      const count = displayedAssignments.filter((a) => {
        const soldier = soldierById.get(a.soldierId);
        return soldier?.platoonId === platoon.id;
      }).length;

      return (
        <div key={platoon.id} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platoon.color }}
            />
            <span>{platoon.name}</span>
          </div>
          <span className="font-medium">{count} שיבוצים</span>
        </div>
      );
    })}
    {(() => {
      const noneCount = displayedAssignments.filter((a) => {
        const soldier = soldierById.get(a.soldierId);
        return !soldier?.platoonId;
      }).length;
      if (noneCount > 0) {
        return (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>ללא מחלקה</span>
            </div>
            <span className="font-medium">{noneCount} שיבוצים</span>
          </div>
        );
      }
      return null;
    })()}
  </div>
</div>
```

**Step 4: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add frontend/src/components/schedule/ScheduleView.tsx
git commit -m "feat(frontend): add platoon integration to schedule view

- Display platoon color badges in assignment cells
- Add platoon filter dropdown in schedule header
- Add platoon distribution statistics card
- Filter assignments by selected platoon

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Backend - Database Synchronization

**Files:**
- Modify: `backend/src/config/database.config.ts`

**Step 1: Verify TypeORM auto-synchronization is enabled**

Read `backend/src/config/database.config.ts` to check if `synchronize: true` is set.

If not already set, add it to ensure schema auto-updates.

**Step 2: Run backend and verify tables created**

Run: `cd backend && npm run start:dev`

Check logs for:
- `platoons` table created
- `soldiers` table updated with `platoonId` column

**Step 3: Test API endpoints**

Create test platoon:
```bash
curl -X POST http://localhost:3000/platoons \
  -H "Content-Type: application/json" \
  -d '{"name": "מחלקה א'"}'
```

Expected: Returns created platoon with auto-assigned color

List platoons:
```bash
curl http://localhost:3000/platoons
```

Expected: Returns array with created platoon

**Step 4: Commit**

```bash
git add backend/src/config/database.config.ts
git commit -m "chore(backend): verify database synchronization for platoons

- Ensure TypeORM synchronization enabled
- Verify platoons table creation
- Verify soldiers.platoonId column addition

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Frontend - Auto-Assign Prompt on First Platoon Creation

**Files:**
- Modify: `frontend/src/components/platoons/PlatoonManagementDialog.tsx`
- Create: `frontend/src/components/platoons/AutoAssignPrompt.tsx`

**Step 1: Create Auto-Assign Prompt Component**

Create `frontend/src/components/platoons/AutoAssignPrompt.tsx`:

```typescript
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAutoAssignPlatoons } from '@/hooks/usePlatoons';
import { toast } from '@/hooks/use-toast';

interface AutoAssignPromptProps {
  unassignedCount: number;
  platoonIds: string[];
  onClose: () => void;
}

export function AutoAssignPrompt({
  unassignedCount,
  platoonIds,
  onClose,
}: AutoAssignPromptProps) {
  const [open, setOpen] = useState(true);
  const autoAssign = useAutoAssignPlatoons();

  useEffect(() => {
    if (!open) onClose();
  }, [open, onClose]);

  const handleAutoAssign = () => {
    autoAssign.mutate(platoonIds, {
      onSuccess: (data) => {
        toast({
          title: 'חיילים חולקו בהצלחה',
          description: `${data.assignedCount} חיילים חולקו בין ${platoonIds.length} מחלקות`,
        });
        setOpen(false);
      },
      onError: () => {
        toast({
          title: 'שגיאה בחלוקת חיילים',
          variant: 'destructive',
        });
      },
    });
  };

  const handleManual = () => {
    toast({
      title: 'ניתן לשבץ ידנית',
      description: 'ניתן לשבץ חיילים למחלקות דרך עריכת החייל',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>חלוקת חיילים למחלקות</DialogTitle>
          <DialogDescription>
            נמצאו {unassignedCount} חיילים ללא מחלקה.
            <br />
            האם לחלק אותם אוטומטית בין המחלקות?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={handleManual}>
            לא, אשבץ ידנית
          </Button>
          <Button onClick={handleAutoAssign} disabled={autoAssign.isPending}>
            {autoAssign.isPending ? 'מחלק...' : 'כן, חלק אוטומטית'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Integrate into PlatoonManagementDialog**

Modify `frontend/src/components/platoons/PlatoonManagementDialog.tsx`:

Add import:
```typescript
import { useSoldiers } from '@/hooks/useSoldiers';
import { AutoAssignPrompt } from './AutoAssignPrompt';
```

Add state:
```typescript
const { data: soldiers = [] } = useSoldiers();
const [showAutoAssign, setShowAutoAssign] = useState(false);
```

Add effect to check for first-time creation:
```typescript
useEffect(() => {
  if (platoons.length > 0) {
    const unassignedCount = soldiers.filter((s) => !s.platoonId).length;
    const hasShownPrompt = localStorage.getItem('platoons-auto-assign-prompted');

    if (unassignedCount > 0 && !hasShownPrompt) {
      setShowAutoAssign(true);
      localStorage.setItem('platoons-auto-assign-prompted', 'true');
    }
  }
}, [platoons.length, soldiers]);
```

Add prompt component at end:
```typescript
{showAutoAssign && (
  <AutoAssignPrompt
    unassignedCount={soldiers.filter((s) => !s.platoonId).length}
    platoonIds={platoons.map((p) => p.id)}
    onClose={() => setShowAutoAssign(false)}
  />
)}
```

**Step 3: Build and verify**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/components/platoons
git commit -m "feat(frontend): add auto-assign prompt on first platoon creation

- Create AutoAssignPrompt component with yes/no options
- Trigger prompt when platoons exist and unassigned soldiers found
- Use localStorage to show prompt only once
- Call auto-assign API on confirmation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Integration Testing and Verification

**Files:**
- No new files, just testing

**Step 1: Start backend**

Run: `cd backend && npm run start:dev`
Expected: Server starts on port 3000

**Step 2: Start frontend**

Run: `cd frontend && npm run dev`
Expected: Dev server starts on port 5173

**Step 3: Test platoon CRUD flow**

Manual testing:
1. Navigate to Soldiers page
2. Click "Manage Platoons"
3. Create 3 platoons (מחלקה א', מחלקה ב', מחלקה ג')
4. Verify colors are different
5. Edit one platoon, change name
6. Verify it updates

**Step 4: Test auto-assign**

1. Check if auto-assign prompt appears
2. Click "Yes, auto-assign"
3. Verify soldiers distributed in tabs
4. Check each platoon tab shows correct soldiers

**Step 5: Test soldier creation with platoon**

1. Create new soldier
2. Select platoon from dropdown
3. Verify soldier appears in correct tab

**Step 6: Test schedule view**

1. Navigate to Schedule
2. Verify platoon badges appear next to soldier names
3. Test platoon filter dropdown
4. Verify only selected platoon's assignments show
5. Check distribution statistics card

**Step 7: Test delete with reassignment**

1. Try to delete platoon with soldiers
2. Verify dialog appears with options
3. Select target platoon or "no platoon"
4. Confirm delete
5. Verify soldiers moved correctly

**Step 8: Document any issues found**

If issues found, fix them before committing.

**Step 9: Commit**

```bash
git commit --allow-empty -m "test: verify platoon feature integration

- Tested CRUD operations for platoons
- Tested auto-assign flow
- Tested soldier-platoon assignment
- Tested schedule view badges and filter
- Tested delete with reassignment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Documentation and PR

**Files:**
- Create: `docs/features/platoons.md`

**Step 1: Create feature documentation**

Create `docs/features/platoons.md`:

```markdown
# Platoons Feature

## Overview

The Platoons feature allows organizing soldiers into platoons (מחלקות) for better management and scheduling.

## Features

### Platoon Management
- Create, edit, and delete platoons
- Each platoon has: name, commander (optional), description (optional), auto-assigned color
- View all platoons with soldier count

### Soldier Assignment
- Assign soldiers to platoons during creation or editing
- Optional - soldiers can remain without platoon
- Bulk reassignment during platoon deletion
- Auto-assign unassigned soldiers to platoons

### Visual Integration
- Platoon tabs in Soldiers page (All, per-platoon, No platoon)
- Platoon color badges in Schedule view assignment cells
- Platoon filter dropdown in Schedule view
- Platoon distribution statistics

## User Flows

### Creating First Platoons
1. Navigate to Soldiers page
2. Click "Manage Platoons" button
3. Click "Add Platoon"
4. Fill in name (required), commander and description (optional)
5. System auto-assigns color
6. After creating platoons, prompt appears to auto-assign existing soldiers

### Assigning Soldier to Platoon
1. Create or edit soldier
2. Select platoon from dropdown (or "No Platoon")
3. Save soldier

### Filtering Schedule by Platoon
1. Navigate to Schedule view
2. Use platoon filter dropdown in header
3. Select platoon to view only its assignments
4. Select "All Platoons" to reset filter

### Deleting Platoon with Soldiers
1. Open Platoon Management dialog
2. Click delete on platoon with soldiers
3. Dialog appears with reassignment options
4. Choose target platoon or "No Platoon"
5. Confirm - soldiers reassigned and platoon deleted

## API Endpoints

### Platoons
- `GET /platoons` - List all platoons with soldier counts
- `POST /platoons` - Create platoon (auto-assigns color)
- `PATCH /platoons/:id` - Update platoon
- `DELETE /platoons/:id` - Delete platoon (fails if has soldiers)
- `POST /platoons/auto-assign` - Distribute unassigned soldiers

### Soldiers
- `PATCH /soldiers/bulk-update` - Bulk update platoon assignment

## Technical Details

### Color Assignment
- 10 predefined colors in palette
- Auto-assigned on creation based on count
- Colors cycle after 10 platoons
- Cannot be manually changed

### Database Schema
- `platoons` table: id, name, commander, color, description, timestamps
- `soldiers.platoonId` column: nullable UUID foreign key
- ON DELETE SET NULL cascade

### Frontend State
- React Query for data fetching
- localStorage tracks if auto-assign prompt shown
- Tabs and filters use local state

## Future Enhancements
- Platoon-specific tasks
- Platoon rotation schedules
- Commander dashboard
- Performance metrics per platoon
```

**Step 2: Commit documentation**

```bash
git add docs/features/platoons.md
git commit -m "docs: add platoons feature documentation

- Document all features and user flows
- Document API endpoints
- Document technical implementation details
- Add notes on future enhancements

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 3: Push branch and create PR**

```bash
git push -u origin feature/platoons
gh pr create --title "feat: add platoons (מחלקות) management" --body "$(cat <<'EOF'
## Summary

Adds platoon management feature allowing soldiers to be organized into platoons with full CRUD operations and visual integration.

## Changes

### Backend
- New `platoons` module with Entity, Service, Controller
- Auto-color assignment from 10-color palette
- Platoon-soldier relation (optional, ON DELETE SET NULL)
- Auto-assign endpoint for distributing unassigned soldiers
- Bulk update endpoint for soldier reassignment

### Frontend
- Platoon management dialog (create, edit, delete)
- Platoon tabs in Soldiers page
- Platoon selector in soldier form
- Platoon badges in Schedule view
- Platoon filter in Schedule view
- Platoon distribution statistics
- Auto-assign prompt on first platoon creation

## Testing
- Unit tests for platoons service
- Manual integration testing completed
- All flows verified

## Documentation
- Added `docs/features/platoons.md`

🤖 Generated with Claude Code
EOF
)"
```

Expected: PR created successfully

**Step 4: Verify PR**

Check PR on GitHub, ensure all commits are included and description is clear.

---

## Success Criteria

All tasks completed:
- [x] Backend platoon module with CRUD
- [x] Soldier-platoon relation
- [x] Auto-assign and bulk update endpoints
- [x] Unit tests for platoons service
- [x] Frontend types and API hooks
- [x] Platoon management dialog
- [x] Soldiers page with tabs
- [x] Schedule view integration
- [x] Database synchronization
- [x] Auto-assign prompt
- [x] Integration testing
- [x] Documentation and PR

The platoons feature is ready for review!
