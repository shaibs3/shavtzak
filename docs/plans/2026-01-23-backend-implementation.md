# Backend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build NestJS + TypeORM backend with CRUD APIs for Soldiers, Tasks, Assignments, and Settings matching the shadcn-ui frontend.

**Architecture:** Complete rewrite of backend modules. TypeORM entities mirror frontend TypeScript types. Simple CRUD operations with validation. PostgreSQL database with Hebrew seed data.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, class-validator, Swagger

---

## Task 1: Clean Backend Directory

**Files:**
- Delete: `backend/src/deployment/`
- Delete: `backend/src/leave/`
- Delete: `backend/src/shifts/`
- Delete: `backend/src/soldiers/`
- Delete: `backend/src/tasks/`
- Delete: `backend/src/users/`
- Delete: `backend/src/validation/`
- Delete: `backend/src/common/`

**Step 1: Remove old modules**

```bash
cd backend/src
rm -rf deployment leave shifts soldiers tasks users validation common
```

**Step 2: Verify clean state**

Run: `ls backend/src`
Expected: Should only see `app.controller.spec.ts`, `app.controller.ts`, `app.module.ts`, `app.service.ts`, `main.ts`

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old backend modules for redesign"
```

---

## Task 2: Configure Database Connection

**Files:**
- Create: `backend/src/config/database.config.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Create database config**

File: `backend/src/config/database.config.ts`

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'shavtzak',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Only for development
  logging: true,
};
```

**Step 2: Update app.module.ts**

File: `backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Step 3: Verify .env file exists**

Check `backend/.env` exists with:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=shavtzak
PORT=3000
```

**Step 4: Commit**

```bash
git add backend/src/config/database.config.ts backend/src/app.module.ts
git commit -m "feat: configure TypeORM database connection"
```

---

## Task 3: Create Soldier Entity

**Files:**
- Create: `backend/src/soldiers/entities/soldier.entity.ts`

**Step 1: Create soldier entity**

File: `backend/src/soldiers/entities/soldier.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Constraint } from './constraint.entity';

@Entity('soldiers')
export class Soldier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  rank: string;

  @Column('simple-array')
  roles: string[];

  @Column({ type: 'int', default: 5 })
  maxVacationDays: number;

  @Column({ type: 'int', default: 0 })
  usedVacationDays: number;

  @OneToMany(() => Constraint, (constraint) => constraint.soldier, {
    cascade: true,
    eager: true,
  })
  constraints: Constraint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add backend/src/soldiers/entities/soldier.entity.ts
git commit -m "feat: create Soldier entity"
```

---

## Task 4: Create Constraint Entity

**Files:**
- Create: `backend/src/soldiers/entities/constraint.entity.ts`

**Step 1: Create constraint entity**

File: `backend/src/soldiers/entities/constraint.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Soldier } from './soldier.entity';

@Entity('constraints')
export class Constraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => Soldier, (soldier) => soldier.constraints, {
    onDelete: 'CASCADE',
  })
  soldier: Soldier;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Step 2: Commit**

```bash
git add backend/src/soldiers/entities/constraint.entity.ts
git commit -m "feat: create Constraint entity"
```

---

## Task 5: Create Task Entity

**Files:**
- Create: `backend/src/tasks/entities/task.entity.ts`

**Step 1: Create task entity**

File: `backend/src/tasks/entities/task.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TaskRole } from './task-role.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int' })
  shiftStartHour: number;

  @Column({ type: 'int' })
  shiftDuration: number;

  @Column({ type: 'int' })
  restTimeBetweenShifts: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TaskRole, (taskRole) => taskRole.task, {
    cascade: true,
    eager: true,
  })
  requiredRoles: TaskRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add backend/src/tasks/entities/task.entity.ts
git commit -m "feat: create Task entity"
```

---

## Task 6: Create TaskRole Entity

**Files:**
- Create: `backend/src/tasks/entities/task-role.entity.ts`

**Step 1: Create task-role entity**

File: `backend/src/tasks/entities/task-role.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';

@Entity('task_roles')
export class TaskRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column({ type: 'int' })
  count: number;

  @ManyToOne(() => Task, (task) => task.requiredRoles, {
    onDelete: 'CASCADE',
  })
  task: Task;
}
```

**Step 2: Commit**

```bash
git add backend/src/tasks/entities/task-role.entity.ts
git commit -m "feat: create TaskRole entity"
```

---

## Task 7: Create Assignment Entity

**Files:**
- Create: `backend/src/assignments/entities/assignment.entity.ts`

**Step 1: Create assignment entity**

File: `backend/src/assignments/entities/assignment.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  taskId: string;

  @Column('uuid')
  soldierId: string;

  @Column()
  role: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: false })
  locked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add backend/src/assignments/entities/assignment.entity.ts
git commit -m "feat: create Assignment entity"
```

---

## Task 8: Create Settings Entity

**Files:**
- Create: `backend/src/settings/entities/settings.entity.ts`

**Step 1: Create settings entity**

File: `backend/src/settings/entities/settings.entity.ts`

```typescript
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  minBasePresence: number;

  @Column({ type: 'int' })
  totalSoldiers: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Commit**

```bash
git add backend/src/settings/entities/settings.entity.ts
git commit -m "feat: create Settings entity"
```

---

## Task 9: Generate Soldiers Module

**Files:**
- Create: `backend/src/soldiers/soldiers.module.ts`
- Create: `backend/src/soldiers/soldiers.controller.ts`
- Create: `backend/src/soldiers/soldiers.service.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Generate module using NestJS CLI**

```bash
cd backend
npx nest g module soldiers --no-spec
npx nest g controller soldiers --no-spec
npx nest g service soldiers --no-spec
```

**Step 2: Update soldiers.module.ts**

File: `backend/src/soldiers/soldiers.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldiersController } from './soldiers.controller';
import { SoldiersService } from './soldiers.service';
import { Soldier } from './entities/soldier.entity';
import { Constraint } from './entities/constraint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Soldier, Constraint])],
  controllers: [SoldiersController],
  providers: [SoldiersService],
  exports: [SoldiersService],
})
export class SoldiersModule {}
```

**Step 3: Verify app.module.ts was updated**

File: `backend/src/app.module.ts` should now import SoldiersModule

**Step 4: Commit**

```bash
git add backend/src/soldiers/soldiers.module.ts backend/src/soldiers/soldiers.controller.ts backend/src/soldiers/soldiers.service.ts backend/src/app.module.ts
git commit -m "feat: generate Soldiers module"
```

---

## Task 10: Create Soldier DTOs

**Files:**
- Create: `backend/src/soldiers/dto/create-soldier.dto.ts`
- Create: `backend/src/soldiers/dto/update-soldier.dto.ts`
- Create: `backend/src/soldiers/dto/create-constraint.dto.ts`

**Step 1: Create create-soldier DTO**

File: `backend/src/soldiers/dto/create-soldier.dto.ts`

```typescript
import { IsString, IsArray, IsInt, Min, Max, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSoldierDto {
  @ApiProperty({ example: 'יוסי כהן' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'סמל' })
  @IsString()
  rank: string;

  @ApiProperty({ example: ['driver', 'soldier'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ example: 5, default: 5 })
  @IsInt()
  @Min(0)
  @Max(365)
  maxVacationDays: number;

  @ApiProperty({ example: 0, default: 0 })
  @IsInt()
  @Min(0)
  usedVacationDays: number;
}
```

**Step 2: Create update-soldier DTO**

File: `backend/src/soldiers/dto/update-soldier.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateSoldierDto } from './create-soldier.dto';

export class UpdateSoldierDto extends PartialType(CreateSoldierDto) {}
```

**Step 3: Create create-constraint DTO**

File: `backend/src/soldiers/dto/create-constraint.dto.ts`

```typescript
import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConstraintDto {
  @ApiProperty({ example: 'vacation', enum: ['unavailable', 'vacation', 'medical', 'other'] })
  @IsString()
  @IsIn(['unavailable', 'vacation', 'medical', 'other'])
  type: string;

  @ApiProperty({ example: '2026-01-25' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-01-27' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 'חופשה משפחתית', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
```

**Step 4: Commit**

```bash
git add backend/src/soldiers/dto/
git commit -m "feat: create Soldier DTOs with validation"
```

---

## Task 11: Implement Soldiers Service

**Files:**
- Modify: `backend/src/soldiers/soldiers.service.ts`

**Step 1: Implement CRUD methods**

File: `backend/src/soldiers/soldiers.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Soldier } from './entities/soldier.entity';
import { Constraint } from './entities/constraint.entity';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';
import { CreateConstraintDto } from './dto/create-constraint.dto';

@Injectable()
export class SoldiersService {
  constructor(
    @InjectRepository(Soldier)
    private soldiersRepository: Repository<Soldier>,
    @InjectRepository(Constraint)
    private constraintsRepository: Repository<Constraint>,
  ) {}

  async create(createSoldierDto: CreateSoldierDto): Promise<Soldier> {
    const soldier = this.soldiersRepository.create(createSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async findAll(): Promise<Soldier[]> {
    return this.soldiersRepository.find();
  }

  async findOne(id: string): Promise<Soldier> {
    const soldier = await this.soldiersRepository.findOne({ where: { id } });
    if (!soldier) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
    return soldier;
  }

  async update(id: string, updateSoldierDto: UpdateSoldierDto): Promise<Soldier> {
    await this.findOne(id); // Check if exists
    await this.soldiersRepository.update(id, updateSoldierDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const soldier = await this.findOne(id);
    await this.soldiersRepository.remove(soldier);
  }

  async addConstraint(
    soldierId: string,
    createConstraintDto: CreateConstraintDto,
  ): Promise<Constraint> {
    const soldier = await this.findOne(soldierId);
    const constraint = this.constraintsRepository.create({
      ...createConstraintDto,
      soldier,
    });
    return this.constraintsRepository.save(constraint);
  }

  async removeConstraint(soldierId: string, constraintId: string): Promise<void> {
    await this.findOne(soldierId); // Verify soldier exists
    const constraint = await this.constraintsRepository.findOne({
      where: { id: constraintId },
      relations: ['soldier'],
    });

    if (!constraint) {
      throw new NotFoundException(`Constraint with ID ${constraintId} not found`);
    }

    if (constraint.soldier.id !== soldierId) {
      throw new NotFoundException(
        `Constraint ${constraintId} does not belong to soldier ${soldierId}`,
      );
    }

    await this.constraintsRepository.remove(constraint);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/soldiers/soldiers.service.ts
git commit -m "feat: implement Soldiers service CRUD methods"
```

---

## Task 12: Implement Soldiers Controller

**Files:**
- Modify: `backend/src/soldiers/soldiers.controller.ts`

**Step 1: Implement REST endpoints**

File: `backend/src/soldiers/soldiers.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SoldiersService } from './soldiers.service';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';
import { CreateConstraintDto } from './dto/create-constraint.dto';

@ApiTags('soldiers')
@Controller('soldiers')
export class SoldiersController {
  constructor(private readonly soldiersService: SoldiersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new soldier' })
  @ApiResponse({ status: 201, description: 'Soldier created successfully' })
  create(@Body() createSoldierDto: CreateSoldierDto) {
    return this.soldiersService.create(createSoldierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all soldiers' })
  @ApiResponse({ status: 200, description: 'List of all soldiers' })
  findAll() {
    return this.soldiersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get soldier by ID' })
  @ApiResponse({ status: 200, description: 'Soldier found' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  findOne(@Param('id') id: string) {
    return this.soldiersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update soldier' })
  @ApiResponse({ status: 200, description: 'Soldier updated successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  update(@Param('id') id: string, @Body() updateSoldierDto: UpdateSoldierDto) {
    return this.soldiersService.update(id, updateSoldierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete soldier' })
  @ApiResponse({ status: 204, description: 'Soldier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  remove(@Param('id') id: string) {
    return this.soldiersService.remove(id);
  }

  @Post(':id/constraints')
  @ApiOperation({ summary: 'Add constraint to soldier' })
  @ApiResponse({ status: 201, description: 'Constraint added successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  addConstraint(
    @Param('id') id: string,
    @Body() createConstraintDto: CreateConstraintDto,
  ) {
    return this.soldiersService.addConstraint(id, createConstraintDto);
  }

  @Delete(':id/constraints/:constraintId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove constraint from soldier' })
  @ApiResponse({ status: 204, description: 'Constraint removed successfully' })
  @ApiResponse({ status: 404, description: 'Soldier or constraint not found' })
  removeConstraint(
    @Param('id') id: string,
    @Param('constraintId') constraintId: string,
  ) {
    return this.soldiersService.removeConstraint(id, constraintId);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/soldiers/soldiers.controller.ts
git commit -m "feat: implement Soldiers REST endpoints"
```

---

## Task 13: Generate Tasks Module

**Files:**
- Create: `backend/src/tasks/tasks.module.ts`
- Create: `backend/src/tasks/tasks.controller.ts`
- Create: `backend/src/tasks/tasks.service.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Generate module using NestJS CLI**

```bash
cd backend
npx nest g module tasks --no-spec
npx nest g controller tasks --no-spec
npx nest g service tasks --no-spec
```

**Step 2: Update tasks.module.ts**

File: `backend/src/tasks/tasks.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { TaskRole } from './entities/task-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskRole])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

**Step 3: Commit**

```bash
git add backend/src/tasks/tasks.module.ts backend/src/tasks/tasks.controller.ts backend/src/tasks/tasks.service.ts backend/src/app.module.ts
git commit -m "feat: generate Tasks module"
```

---

## Task 14: Create Task DTOs

**Files:**
- Create: `backend/src/tasks/dto/create-task.dto.ts`
- Create: `backend/src/tasks/dto/update-task.dto.ts`
- Create: `backend/src/tasks/dto/task-role.dto.ts`

**Step 1: Create task-role DTO**

File: `backend/src/tasks/dto/task-role.dto.ts`

```typescript
import { IsString, IsInt, Min, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TaskRoleDto {
  @ApiProperty({ example: 'commander', enum: ['commander', 'driver', 'radio_operator', 'soldier'] })
  @IsString()
  @IsIn(['commander', 'driver', 'radio_operator', 'soldier'])
  role: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  count: number;
}
```

**Step 2: Create create-task DTO**

File: `backend/src/tasks/dto/create-task.dto.ts`

```typescript
import { IsString, IsInt, Min, Max, IsBoolean, IsOptional, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskRoleDto } from './task-role.dto';

export class CreateTaskDto {
  @ApiProperty({ example: 'שמירה בשער' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'משמרת שמירה בכניסה הראשית', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [TaskRoleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskRoleDto)
  requiredRoles: TaskRoleDto[];

  @ApiProperty({ example: 8, minimum: 0, maximum: 23 })
  @IsInt()
  @Min(0)
  @Max(23)
  shiftStartHour: number;

  @ApiProperty({ example: 8, minimum: 1 })
  @IsInt()
  @Min(1)
  shiftDuration: number;

  @ApiProperty({ example: 12, minimum: 0 })
  @IsInt()
  @Min(0)
  restTimeBetweenShifts: number;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  isActive: boolean;
}
```

**Step 3: Create update-task DTO**

File: `backend/src/tasks/dto/update-task.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

**Step 4: Commit**

```bash
git add backend/src/tasks/dto/
git commit -m "feat: create Task DTOs with validation"
```

---

## Task 15: Implement Tasks Service

**Files:**
- Modify: `backend/src/tasks/tasks.service.ts`

**Step 1: Implement CRUD methods**

File: `backend/src/tasks/tasks.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskRole } from './entities/task-role.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskRole)
    private taskRolesRepository: Repository<TaskRole>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { requiredRoles, ...taskData } = createTaskDto;

    const task = this.tasksRepository.create(taskData);
    const savedTask = await this.tasksRepository.save(task);

    const roles = requiredRoles.map(roleDto =>
      this.taskRolesRepository.create({
        ...roleDto,
        task: savedTask,
      }),
    );

    await this.taskRolesRepository.save(roles);

    return this.findOne(savedTask.id);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    const { requiredRoles, ...taskData } = updateTaskDto;

    if (Object.keys(taskData).length > 0) {
      await this.tasksRepository.update(id, taskData);
    }

    if (requiredRoles) {
      // Delete existing roles
      await this.taskRolesRepository.delete({ task: { id } });

      // Create new roles
      const roles = requiredRoles.map(roleDto =>
        this.taskRolesRepository.create({
          ...roleDto,
          task,
        }),
      );
      await this.taskRolesRepository.save(roles);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/tasks/tasks.service.ts
git commit -m "feat: implement Tasks service CRUD methods"
```

---

## Task 16: Implement Tasks Controller

**Files:**
- Modify: `backend/src/tasks/tasks.controller.ts`

**Step 1: Implement REST endpoints**

File: `backend/src/tasks/tasks.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'List of all tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/tasks/tasks.controller.ts
git commit -m "feat: implement Tasks REST endpoints"
```

---

## Task 17: Generate Assignments Module

**Files:**
- Create: `backend/src/assignments/assignments.module.ts`
- Create: `backend/src/assignments/assignments.controller.ts`
- Create: `backend/src/assignments/assignments.service.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Generate module using NestJS CLI**

```bash
cd backend
npx nest g module assignments --no-spec
npx nest g controller assignments --no-spec
npx nest g service assignments --no-spec
```

**Step 2: Update assignments.module.ts**

File: `backend/src/assignments/assignments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Assignment])],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
```

**Step 3: Commit**

```bash
git add backend/src/assignments/assignments.module.ts backend/src/assignments/assignments.controller.ts backend/src/assignments/assignments.service.ts backend/src/app.module.ts
git commit -m "feat: generate Assignments module"
```

---

## Task 18: Create Assignment DTOs

**Files:**
- Create: `backend/src/assignments/dto/create-assignment.dto.ts`
- Create: `backend/src/assignments/dto/update-assignment.dto.ts`

**Step 1: Create create-assignment DTO**

File: `backend/src/assignments/dto/create-assignment.dto.ts`

```typescript
import { IsString, IsUUID, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssignmentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  soldierId: string;

  @ApiProperty({ example: 'commander', enum: ['commander', 'driver', 'radio_operator', 'soldier'] })
  @IsString()
  @IsIn(['commander', 'driver', 'radio_operator', 'soldier'])
  role: string;

  @ApiProperty({ example: '2026-01-25T08:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-01-25T16:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiProperty({ example: false, default: false })
  @IsBoolean()
  locked: boolean;
}
```

**Step 2: Create update-assignment DTO**

File: `backend/src/assignments/dto/update-assignment.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateAssignmentDto } from './create-assignment.dto';

export class UpdateAssignmentDto extends PartialType(CreateAssignmentDto) {}
```

**Step 3: Commit**

```bash
git add backend/src/assignments/dto/
git commit -m "feat: create Assignment DTOs with validation"
```

---

## Task 19: Implement Assignments Service

**Files:**
- Modify: `backend/src/assignments/assignments.service.ts`

**Step 1: Implement CRUD methods**

File: `backend/src/assignments/assignments.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    const assignment = this.assignmentsRepository.create(createAssignmentDto);
    return this.assignmentsRepository.save(assignment);
  }

  async findAll(): Promise<Assignment[]> {
    return this.assignmentsRepository.find();
  }

  async findOne(id: string): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    await this.findOne(id); // Check if exists
    await this.assignmentsRepository.update(id, updateAssignmentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentsRepository.remove(assignment);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/assignments/assignments.service.ts
git commit -m "feat: implement Assignments service CRUD methods"
```

---

## Task 20: Implement Assignments Controller

**Files:**
- Modify: `backend/src/assignments/assignments.controller.ts`

**Step 1: Implement REST endpoints**

File: `backend/src/assignments/assignments.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@ApiTags('assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new assignment' })
  @ApiResponse({ status: 201, description: 'Assignment created successfully' })
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentsService.create(createAssignmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all assignments' })
  @ApiResponse({ status: 200, description: 'List of all assignments' })
  findAll() {
    return this.assignmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  @ApiResponse({ status: 200, description: 'Assignment found' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assignment' })
  @ApiResponse({ status: 200, description: 'Assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiResponse({ status: 204, description: 'Assignment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  remove(@Param('id') id: string) {
    return this.assignmentsService.remove(id);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/assignments/assignments.controller.ts
git commit -m "feat: implement Assignments REST endpoints"
```

---

## Task 21: Generate Settings Module

**Files:**
- Create: `backend/src/settings/settings.module.ts`
- Create: `backend/src/settings/settings.controller.ts`
- Create: `backend/src/settings/settings.service.ts`
- Modify: `backend/src/app.module.ts`

**Step 1: Generate module using NestJS CLI**

```bash
cd backend
npx nest g module settings --no-spec
npx nest g controller settings --no-spec
npx nest g service settings --no-spec
```

**Step 2: Update settings.module.ts**

File: `backend/src/settings/settings.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { Settings } from './entities/settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
```

**Step 3: Commit**

```bash
git add backend/src/settings/settings.module.ts backend/src/settings/settings.controller.ts backend/src/settings/settings.service.ts backend/src/app.module.ts
git commit -m "feat: generate Settings module"
```

---

## Task 22: Create Settings DTOs

**Files:**
- Create: `backend/src/settings/dto/update-settings.dto.ts`

**Step 1: Create update-settings DTO**

File: `backend/src/settings/dto/update-settings.dto.ts`

```typescript
import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: 75, minimum: 0, maximum: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minBasePresence?: number;

  @ApiProperty({ example: 20, minimum: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalSoldiers?: number;
}
```

**Step 2: Commit**

```bash
git add backend/src/settings/dto/
git commit -m "feat: create Settings DTOs with validation"
```

---

## Task 23: Implement Settings Service

**Files:**
- Modify: `backend/src/settings/settings.service.ts`

**Step 1: Implement singleton pattern**

File: `backend/src/settings/settings.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async get(): Promise<Settings> {
    const settings = await this.settingsRepository.find();

    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = this.settingsRepository.create({
        minBasePresence: 75,
        totalSoldiers: 20,
      });
      return this.settingsRepository.save(defaultSettings);
    }

    return settings[0];
  }

  async update(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    const settings = await this.get();
    await this.settingsRepository.update(settings.id, updateSettingsDto);
    return this.get();
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/settings/settings.service.ts
git commit -m "feat: implement Settings service with singleton pattern"
```

---

## Task 24: Implement Settings Controller

**Files:**
- Modify: `backend/src/settings/settings.controller.ts`

**Step 1: Implement REST endpoints**

File: `backend/src/settings/settings.controller.ts`

```typescript
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get application settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  get() {
    return this.settingsService.get();
  }

  @Patch()
  @ApiOperation({ summary: 'Update application settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  update(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.update(updateSettingsDto);
  }
}
```

**Step 2: Commit**

```bash
git add backend/src/settings/settings.controller.ts
git commit -m "feat: implement Settings REST endpoints"
```

---

## Task 25: Update Main.ts for API Prefix

**Files:**
- Modify: `backend/src/main.ts`

**Step 1: Add global prefix and update Swagger tags**

File: `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('Shavtzak API')
    .setDescription('Duty scheduler API for military scheduling')
    .setVersion('2.0')
    .addTag('soldiers', 'Soldier management')
    .addTag('tasks', 'Task/duty type management')
    .addTag('assignments', 'Shift assignment management')
    .addTag('settings', 'Application settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`API available at: http://localhost:${process.env.PORT ?? 3000}/api`);
  console.log(`Swagger docs: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
```

**Step 2: Commit**

```bash
git add backend/src/main.ts
git commit -m "feat: configure API prefix and update Swagger documentation"
```

---

## Task 26: Create Database Seed Script

**Files:**
- Create: `backend/src/database/seeds/initial-data.seed.ts`

**Step 1: Create seed script**

File: `backend/src/database/seeds/initial-data.seed.ts`

```typescript
import { DataSource } from 'typeorm';
import { Soldier } from '../../soldiers/entities/soldier.entity';
import { Task } from '../../tasks/entities/task.entity';
import { TaskRole } from '../../tasks/entities/task-role.entity';
import { Settings } from '../../settings/entities/settings.entity';

export async function seedInitialData(dataSource: DataSource) {
  const soldierRepo = dataSource.getRepository(Soldier);
  const taskRepo = dataSource.getRepository(Task);
  const taskRoleRepo = dataSource.getRepository(TaskRole);
  const settingsRepo = dataSource.getRepository(Settings);

  // Clear existing data
  await taskRoleRepo.delete({});
  await taskRepo.delete({});
  await soldierRepo.delete({});
  await settingsRepo.delete({});

  // Seed soldiers
  const soldiers = [
    {
      name: 'יוסי כהן',
      rank: 'סמל',
      roles: ['driver', 'soldier'],
      maxVacationDays: 5,
      usedVacationDays: 1,
    },
    {
      name: 'דני לוי',
      rank: 'רב"ט',
      roles: ['commander', 'soldier'],
      maxVacationDays: 5,
      usedVacationDays: 0,
    },
    {
      name: 'משה ישראלי',
      rank: 'טוראי',
      roles: ['radio_operator', 'soldier'],
      maxVacationDays: 5,
      usedVacationDays: 2,
    },
  ];

  await soldierRepo.save(soldiers);
  console.log('Seeded 3 soldiers');

  // Seed tasks
  const task1 = await taskRepo.save({
    name: 'שמירה בשער',
    description: 'משמרת שמירה בכניסה הראשית',
    shiftStartHour: 8,
    shiftDuration: 8,
    restTimeBetweenShifts: 12,
    isActive: true,
  });

  await taskRoleRepo.save([
    { role: 'commander', count: 1, task: task1 },
    { role: 'soldier', count: 2, task: task1 },
  ]);

  const task2 = await taskRepo.save({
    name: 'סיור',
    description: 'סיור מבצעי בגזרה',
    shiftStartHour: 8,
    shiftDuration: 6,
    restTimeBetweenShifts: 8,
    isActive: true,
  });

  await taskRoleRepo.save([
    { role: 'commander', count: 1, task: task2 },
    { role: 'driver', count: 1, task: task2 },
    { role: 'radio_operator', count: 1, task: task2 },
    { role: 'soldier', count: 2, task: task2 },
  ]);

  console.log('Seeded 2 tasks with required roles');

  // Seed settings
  await settingsRepo.save({
    minBasePresence: 75,
    totalSoldiers: 20,
  });

  console.log('Seeded settings');
  console.log('✅ Database seeded successfully');
}
```

**Step 2: Commit**

```bash
git add backend/src/database/seeds/initial-data.seed.ts
git commit -m "feat: create database seed script with Hebrew sample data"
```

---

## Task 27: Create Seed Runner Script

**Files:**
- Create: `backend/src/database/seed.ts`

**Step 1: Create seed runner**

File: `backend/src/database/seed.ts`

```typescript
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { seedInitialData } from './seeds/initial-data.seed';

async function runSeed() {
  const dataSource = new DataSource(databaseConfig as any);

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedInitialData(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

runSeed();
```

**Step 2: Add seed script to package.json**

File: `backend/package.json` - Add to scripts section:

```json
"seed": "ts-node src/database/seed.ts"
```

**Step 3: Commit**

```bash
git add backend/src/database/seed.ts backend/package.json
git commit -m "feat: create seed runner script"
```

---

## Task 28: Test Backend - Start Server

**Files:**
- None (testing step)

**Step 1: Ensure PostgreSQL is running**

Check if PostgreSQL is running:
```bash
docker ps | grep postgres
```

If not running, start it:
```bash
cd backend
docker-compose up -d
```

**Step 2: Start the backend server**

```bash
cd backend
npm run start:dev
```

Expected output:
- "Application is running on: http://localhost:3000"
- "API available at: http://localhost:3000/api"
- "Swagger docs: http://localhost:3000/api"
- No TypeORM errors
- Tables created successfully

**Step 3: Verify in browser**

Open http://localhost:3000/api in browser
Expected: Swagger UI showing all endpoints (soldiers, tasks, assignments, settings)

---

## Task 29: Test Backend - Run Seed Script

**Files:**
- None (testing step)

**Step 1: Run seed script**

```bash
cd backend
npm run seed
```

Expected output:
- "Database connection established"
- "Seeded 3 soldiers"
- "Seeded 2 tasks with required roles"
- "Seeded settings"
- "✅ Database seeded successfully"
- "Database connection closed"

**Step 2: Verify data via Swagger**

Open http://localhost:3000/api
- GET /api/soldiers - Should return 3 Hebrew soldiers
- GET /api/tasks - Should return 2 Hebrew tasks with requiredRoles
- GET /api/settings - Should return minBasePresence: 75, totalSoldiers: 20

**Step 3: Test CRUD operations**

Via Swagger UI:
1. Create a new soldier (POST /api/soldiers)
2. Update the soldier (PATCH /api/soldiers/:id)
3. Delete the soldier (DELETE /api/soldiers/:id)
4. Verify all operations work

---

## Task 30: Commit Backend Complete

**Files:**
- None (commit step)

**Step 1: Verify all changes committed**

```bash
git status
```

Expected: "nothing to commit, working tree clean"

**Step 2: Create completion commit if needed**

```bash
git add -A
git commit -m "feat: complete backend CRUD implementation

- All entities created (Soldier, Constraint, Task, TaskRole, Assignment, Settings)
- All modules with services and controllers
- Full CRUD operations for all resources
- Validation with class-validator
- Swagger documentation
- Database seed script with Hebrew sample data
- Tested and verified working"
```

**Step 3: Push to remote**

```bash
git push
```

---

## Next Phase: Frontend Integration

After backend is complete and tested, proceed to frontend integration:

### Task 31: Create API Client Service

**Files:**
- Create: `frontend/src/services/api/client.ts`
- Create: `frontend/src/services/api/soldiers.ts`
- Create: `frontend/src/services/api/tasks.ts`
- Create: `frontend/src/services/api/assignments.ts`
- Create: `frontend/src/services/api/settings.ts`

### Task 32: Integrate React Query

**Files:**
- Modify: `frontend/src/components/soldiers/SoldiersView.tsx`
- Modify: `frontend/src/components/tasks/TasksView.tsx`
- Modify: `frontend/src/components/schedule/ScheduleView.tsx`
- Modify: `frontend/src/components/settings/SettingsView.tsx`

### Task 33: Remove Zustand Persistence

**Files:**
- Modify: `frontend/src/store/schedulingStore.ts`

---

## Success Criteria

Backend implementation is complete when:

- ✅ All entities created and migrated to database
- ✅ All CRUD endpoints implemented
- ✅ Validation working on all inputs
- ✅ Swagger documentation accessible at /api
- ✅ Database seeded with Hebrew sample data
- ✅ All endpoints tested and working
- ✅ No console errors or warnings
- ✅ TypeORM synchronize creating schema correctly

## Notes

- Run backend with `npm run start:dev` for auto-reload during development
- Access Swagger docs at http://localhost:3000/api
- Run seed script with `npm run seed` to reset data
- PostgreSQL must be running (via docker-compose up -d)
- All IDs are UUIDs to match frontend expectations
- Entity relationships use cascade for automatic cleanup
