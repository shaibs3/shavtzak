# Shabtzaq MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional military deployment scheduler MVP with manual shift creation, constraint validation, and role-based access in 4 weeks.

**Architecture:** NestJS backend with PostgreSQL database, React frontend with TypeScript. TDD approach with Jest for backend testing and React Testing Library for frontend. Deploy backend to Render.com and frontend to Vercel.

**Tech Stack:** NestJS, TypeScript, PostgreSQL, TypeORM, JWT, React, Redux Toolkit, Axios, React Testing Library, Jest

---

## Week 1: Backend Foundation

### Task 1: Initialize Backend Project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`

**Step 1: Create backend directory and initialize NestJS project**

```bash
cd /Users/shaibenshalom/projects/shavtzak
npx @nestjs/cli new backend
cd backend
```

When prompted, select `npm` as package manager.

**Step 2: Install required dependencies**

```bash
npm install --save @nestjs/typeorm typeorm pg @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm install --save-dev @types/passport-jwt @types/bcrypt
```

Expected: All packages installed successfully

**Step 3: Create environment configuration**

Create `backend/.env.example`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=shabtzaq
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h
PORT=3000
```

**Step 4: Update .gitignore**

Add to `backend/.gitignore`:

```
.env
dist/
node_modules/
*.log
```

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: initialize NestJS backend project

- Set up NestJS with TypeScript
- Add database and auth dependencies
- Configure environment variables"
```

---

### Task 2: Database Setup and Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/.env`

**Step 1: Create Docker Compose file**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: shabtzaq_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: shabtzaq
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Step 2: Create local .env file**

```bash
cd backend
cp .env.example .env
```

**Step 3: Start PostgreSQL**

```bash
cd /Users/shaibenshalom/projects/shavtzak
docker-compose up -d
```

Expected: Container started successfully

**Step 4: Verify database connection**

```bash
docker exec -it shabtzaq_db psql -U postgres -d shabtzaq -c "SELECT version();"
```

Expected: PostgreSQL version output

**Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add PostgreSQL Docker setup

- Configure Docker Compose for local development
- Add database connection environment variables"
```

---

### Task 3: TypeORM Configuration and Base Entities

**Files:**
- Modify: `backend/src/app.module.ts`
- Create: `backend/src/common/entities/base.entity.ts`

**Step 1: Configure TypeORM in app module**

Update `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**Step 2: Create base entity**

Create `backend/src/common/entities/base.entity.ts`:

```typescript
import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 3: Test the configuration**

```bash
cd backend
npm run start:dev
```

Expected: Server starts without errors, TypeORM connects to database

**Step 4: Stop the server**

Press `Ctrl+C`

**Step 5: Commit**

```bash
git add backend/src/
git commit -m "feat: configure TypeORM with PostgreSQL

- Add TypeORM module configuration
- Create base entity with common fields
- Enable database synchronization for development"
```

---

### Task 4: User and Authentication Entities

**Files:**
- Create: `backend/src/users/entities/user.entity.ts`
- Create: `backend/src/soldiers/entities/soldier.entity.ts`

**Step 1: Create users module**

```bash
cd backend
npx nest generate module users
npx nest generate service users
npx nest generate controller users
```

**Step 2: Create User entity**

Create `backend/src/users/entities/user.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

export enum UserRole {
  COMMANDER = 'commander',
  SOLDIER = 'soldier',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ name: 'soldier_id', nullable: true })
  soldierId: string;

  @ManyToOne(() => Soldier, { nullable: true })
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;
}
```

**Step 3: Create soldiers module**

```bash
npx nest generate module soldiers
npx nest generate service soldiers
npx nest generate controller soldiers
```

**Step 4: Create Soldier entity**

Create `backend/src/soldiers/entities/soldier.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('soldiers')
export class Soldier extends BaseEntity {
  @Column()
  name: string;

  @Column()
  rank: string;

  @Column({ name: 'is_commander', default: false })
  isCommander: boolean;

  @Column({ name: 'is_driver', default: false })
  isDriver: boolean;

  @Column({ name: 'is_specialist', default: false })
  isSpecialist: boolean;

  @Column({ name: 'vacation_quota_days', default: 20 })
  vacationQuotaDays: number;

  @Column({ name: 'vacation_days_used', default: 0 })
  vacationDaysUsed: number;
}
```

**Step 5: Register entities in modules**

Update `backend/src/users/users.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Update `backend/src/soldiers/soldiers.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldiersService } from './soldiers.service';
import { SoldiersController } from './soldiers.controller';
import { Soldier } from './entities/soldier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Soldier])],
  controllers: [SoldiersController],
  providers: [SoldiersService],
  exports: [SoldiersService],
})
export class SoldiersModule {}
```

**Step 6: Start server to create tables**

```bash
npm run start:dev
```

Expected: Tables created in database (users, soldiers)

**Step 7: Verify tables created**

```bash
docker exec -it shabtzaq_db psql -U postgres -d shabtzaq -c "\dt"
```

Expected: Shows users and soldiers tables

**Step 8: Stop server**

Press `Ctrl+C`

**Step 9: Commit**

```bash
git add backend/src/
git commit -m "feat: add User and Soldier entities

- Create User entity with role-based access
- Create Soldier entity with qualifications
- Configure TypeORM relationships"
```

---

### Task 5: Remaining Core Entities

**Files:**
- Create: `backend/src/tasks/entities/task.entity.ts`
- Create: `backend/src/shifts/entities/shift.entity.ts`
- Create: `backend/src/shifts/entities/shift-assignment.entity.ts`
- Create: `backend/src/leave/entities/leave-record.entity.ts`
- Create: `backend/src/deployment/entities/deployment.entity.ts`

**Step 1: Generate modules**

```bash
cd backend
npx nest generate module tasks
npx nest generate service tasks
npx nest generate controller tasks
npx nest generate module shifts
npx nest generate service shifts
npx nest generate controller shifts
npx nest generate module leave
npx nest generate service leave
npx nest generate controller leave
npx nest generate module deployment
npx nest generate service deployment
npx nest generate controller deployment
```

**Step 2: Create Task entity**

Create `backend/src/tasks/entities/task.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ name: 'commanders_needed', default: 0 })
  commandersNeeded: number;

  @Column({ name: 'drivers_needed', default: 0 })
  driversNeeded: number;

  @Column({ name: 'specialists_needed', default: 0 })
  specialistsNeeded: number;

  @Column({ name: 'general_soldiers_needed', default: 0 })
  generalSoldiersNeeded: number;

  @Column({ name: 'shift_duration_hours' })
  shiftDurationHours: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
```

**Step 3: Create Shift entity**

Create `backend/src/shifts/entities/shift.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';
import { ShiftAssignment } from './shift-assignment.entity';

export enum ShiftStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('shifts')
export class Shift extends BaseEntity {
  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.SCHEDULED,
  })
  status: ShiftStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @ManyToOne(() => Soldier, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: Soldier;

  @OneToMany(() => ShiftAssignment, assignment => assignment.shift, { cascade: true })
  assignments: ShiftAssignment[];
}
```

**Step 4: Create ShiftAssignment entity**

Create `backend/src/shifts/entities/shift-assignment.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Shift } from './shift.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

export enum AssignmentRole {
  COMMANDER = 'commander',
  DRIVER = 'driver',
  SPECIALIST = 'specialist',
  GENERAL = 'general',
}

@Entity('shift_assignments')
export class ShiftAssignment extends BaseEntity {
  @Column({ name: 'shift_id' })
  shiftId: string;

  @ManyToOne(() => Shift, shift => shift.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ name: 'soldier_id' })
  soldierId: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;

  @Column({
    type: 'enum',
    enum: AssignmentRole,
  })
  role: AssignmentRole;

  @Column({ name: 'assigned_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt: Date;
}
```

**Step 5: Create LeaveRecord entity**

Create `backend/src/leave/entities/leave-record.entity.ts`:

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Soldier } from '../../soldiers/entities/soldier.entity';

@Entity('leave_records')
export class LeaveRecord extends BaseEntity {
  @Column({ name: 'soldier_id' })
  soldierId: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'soldier_id' })
  soldier: Soldier;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'entered_by' })
  enteredBy: string;

  @ManyToOne(() => Soldier)
  @JoinColumn({ name: 'entered_by' })
  enteredByUser: Soldier;
}
```

**Step 6: Create Deployment entity**

Create `backend/src/deployment/entities/deployment.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('deployment')
export class Deployment extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'total_manpower' })
  totalManpower: number;

  @Column({ name: 'minimum_presence_percentage', default: 75 })
  minimumPresencePercentage: number;

  @Column({ name: 'minimum_rest_hours', default: 12 })
  minimumRestHours: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
```

**Step 7: Register entities in modules**

Update each module's imports similarly. Example for `backend/src/tasks/tasks.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task } from './entities/task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
```

Repeat for shifts (include both Shift and ShiftAssignment), leave, and deployment modules.

**Step 8: Import modules in app.module.ts**

Update `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { SoldiersModule } from './soldiers/soldiers.module';
import { TasksModule } from './tasks/tasks.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LeaveModule } from './leave/leave.module';
import { DeploymentModule } from './deployment/deployment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SoldiersModule,
    TasksModule,
    ShiftsModule,
    LeaveModule,
    DeploymentModule,
  ],
})
export class AppModule {}
```

**Step 9: Start server to create tables**

```bash
npm run start:dev
```

Expected: All tables created successfully

**Step 10: Verify tables**

```bash
docker exec -it shabtzaq_db psql -U postgres -d shabtzaq -c "\dt"
```

Expected: Shows all tables (users, soldiers, tasks, shifts, shift_assignments, leave_records, deployment)

**Step 11: Stop server and commit**

```bash
# Press Ctrl+C to stop
git add backend/src/
git commit -m "feat: add core scheduling entities

- Create Task entity with personnel requirements
- Create Shift and ShiftAssignment entities
- Create LeaveRecord entity
- Create Deployment entity
- Configure all entity relationships"
```

---

### Task 6: Authentication Module - Part 1 (JWT Strategy)

**Files:**
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`

**Step 1: Generate auth module**

```bash
cd backend
npx nest generate module auth
npx nest generate service auth
npx nest generate controller auth
```

**Step 2: Create JWT strategy**

Create `backend/src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}
```

**Step 3: Create JWT auth guard**

Create `backend/src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Step 4: Create roles decorator**

Create `backend/src/auth/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Step 5: Create roles guard**

Create `backend/src/auth/guards/roles.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

**Step 6: Update auth module**

Update `backend/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Step 7: Import auth module in app.module.ts**

Update `backend/src/app.module.ts` to include AuthModule in imports array.

**Step 8: Commit**

```bash
git add backend/src/auth/
git commit -m "feat: add JWT authentication strategy

- Create JWT strategy with Passport
- Add JWT auth guard for route protection
- Add roles guard for role-based access control
- Create roles decorator for endpoint authorization"
```

---

### Task 7: Authentication Module - Part 2 (Service and DTOs)

**Files:**
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/dto/register.dto.ts`
- Modify: `backend/src/auth/auth.service.ts`
- Modify: `backend/src/auth/auth.controller.ts`
- Modify: `backend/src/users/users.service.ts`

**Step 1: Create DTOs**

Create `backend/src/auth/dto/login.dto.ts`:

```typescript
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

Create `backend/src/auth/dto/register.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  soldierId?: string;
}
```

**Step 2: Implement Users service methods**

Update `backend/src/users/users.service.ts`:

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(username: string, password: string, role: string, soldierId?: string): Promise<User> {
    const existing = await this.usersRepository.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      passwordHash,
      role: role as any,
      soldierId,
    });

    return this.usersRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username }, relations: ['soldier'] });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id }, relations: ['soldier'] });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
```

**Step 3: Implement Auth service**

Update `backend/src/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(
      registerDto.username,
      registerDto.password,
      registerDto.role,
      registerDto.soldierId,
    );

    return {
      message: 'User registered successfully',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.usersService.validatePassword(user, loginDto.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        soldier: user.soldier,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      soldier: user.soldier,
    };
  }
}
```

**Step 4: Implement Auth controller**

Update `backend/src/auth/auth.controller.ts`:

```typescript
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
```

**Step 5: Enable validation pipe globally**

Update `backend/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
```

**Step 6: Test auth endpoints**

```bash
npm run start:dev
```

In another terminal:

```bash
# Register a commander
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"commander1","password":"password123","role":"commander"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"commander1","password":"password123"}'
```

Expected: Registration success, login returns access_token

**Step 7: Stop server and commit**

```bash
git add backend/src/
git commit -m "feat: implement authentication service and endpoints

- Add login and registration DTOs with validation
- Implement user creation and password validation
- Create JWT token generation and validation
- Add auth controller endpoints
- Enable global validation pipe"
```

---

### Task 8: Soldiers CRUD Operations

**Files:**
- Create: `backend/src/soldiers/dto/create-soldier.dto.ts`
- Create: `backend/src/soldiers/dto/update-soldier.dto.ts`
- Modify: `backend/src/soldiers/soldiers.service.ts`
- Modify: `backend/src/soldiers/soldiers.controller.ts`

**Step 1: Create DTOs**

Create `backend/src/soldiers/dto/create-soldier.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class CreateSoldierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  rank: string;

  @IsBoolean()
  @IsOptional()
  isCommander?: boolean;

  @IsBoolean()
  @IsOptional()
  isDriver?: boolean;

  @IsBoolean()
  @IsOptional()
  isSpecialist?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  vacationQuotaDays?: number;
}
```

Create `backend/src/soldiers/dto/update-soldier.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateSoldierDto } from './create-soldier.dto';

export class UpdateSoldierDto extends PartialType(CreateSoldierDto) {}
```

**Step 2: Implement Soldiers service**

Update `backend/src/soldiers/soldiers.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Soldier } from './entities/soldier.entity';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';

@Injectable()
export class SoldiersService {
  constructor(
    @InjectRepository(Soldier)
    private soldiersRepository: Repository<Soldier>,
  ) {}

  async create(createSoldierDto: CreateSoldierDto): Promise<Soldier> {
    const soldier = this.soldiersRepository.create(createSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async findAll(): Promise<Soldier[]> {
    return this.soldiersRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Soldier> {
    const soldier = await this.soldiersRepository.findOne({ where: { id } });
    if (!soldier) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
    return soldier;
  }

  async update(id: string, updateSoldierDto: UpdateSoldierDto): Promise<Soldier> {
    const soldier = await this.findOne(id);
    Object.assign(soldier, updateSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async remove(id: string): Promise<void> {
    const result = await this.soldiersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
  }
}
```

**Step 3: Implement Soldiers controller**

Update `backend/src/soldiers/soldiers.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SoldiersService } from './soldiers.service';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/soldiers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SoldiersController {
  constructor(private soldiersService: SoldiersService) {}

  @Post()
  @Roles(UserRole.COMMANDER)
  create(@Body() createSoldierDto: CreateSoldierDto) {
    return this.soldiersService.create(createSoldierDto);
  }

  @Get()
  findAll() {
    return this.soldiersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.soldiersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.COMMANDER)
  update(@Param('id') id: string, @Body() updateSoldierDto: UpdateSoldierDto) {
    return this.soldiersService.update(id, updateSoldierDto);
  }

  @Delete(':id')
  @Roles(UserRole.COMMANDER)
  remove(@Param('id') id: string) {
    return this.soldiersService.remove(id);
  }
}
```

**Step 4: Test endpoints**

```bash
npm run start:dev
```

In another terminal:

```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"commander1","password":"password123"}' | jq -r '.access_token')

# Create soldier
curl -X POST http://localhost:3000/api/soldiers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"John Doe","rank":"Private","isDriver":true,"vacationQuotaDays":20}'

# Get all soldiers
curl -X GET http://localhost:3000/api/soldiers \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Soldier created successfully, list returns soldiers

**Step 5: Stop server and commit**

```bash
git add backend/src/soldiers/
git commit -m "feat: implement soldiers CRUD endpoints

- Add create and update soldier DTOs
- Implement soldier service with CRUD operations
- Add role-based access control (commander only for create/update/delete)
- Add validation for soldier data"
```

---

### Task 9: Tasks CRUD Operations

**Files:**
- Create: `backend/src/tasks/dto/create-task.dto.ts`
- Create: `backend/src/tasks/dto/update-task.dto.ts`
- Modify: `backend/src/tasks/tasks.service.ts`
- Modify: `backend/src/tasks/tasks.controller.ts`

**Step 1: Create DTOs**

Create `backend/src/tasks/dto/create-task.dto.ts`:

```typescript
import { IsString, IsNotEmpty, IsInt, Min, IsBoolean, IsOptional } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  @Min(0)
  commandersNeeded: number;

  @IsInt()
  @Min(0)
  driversNeeded: number;

  @IsInt()
  @Min(0)
  specialistsNeeded: number;

  @IsInt()
  @Min(0)
  generalSoldiersNeeded: number;

  @IsInt()
  @Min(1)
  shiftDurationHours: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

Create `backend/src/tasks/dto/update-task.dto.ts`:

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
```

**Step 2: Implement Tasks service**

Update `backend/src/tasks/tasks.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create(createTaskDto);
    return this.tasksRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
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
    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }
}
```

**Step 3: Implement Tasks controller**

Update `backend/src/tasks/tasks.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @Roles(UserRole.COMMANDER)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.COMMANDER)
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @Roles(UserRole.COMMANDER)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
```

**Step 4: Test endpoints**

```bash
# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Guard Duty","type":"Guard","commandersNeeded":1,"driversNeeded":0,"specialistsNeeded":0,"generalSoldiersNeeded":3,"shiftDurationHours":8}'

# Get all tasks
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Task created, list returns tasks

**Step 5: Commit**

```bash
git add backend/src/tasks/
git commit -m "feat: implement tasks CRUD endpoints

- Add create and update task DTOs
- Implement task service with CRUD operations
- Add commander-only access for modifications
- Validate task requirements and duration"
```

---

## Week 2: Core Scheduling Logic

### Task 10: Constraint Validation Service - Part 1 (Structure)

**Files:**
- Create: `backend/src/validation/validation.service.ts`
- Create: `backend/src/validation/validation.module.ts`
- Create: `backend/src/validation/interfaces/validation-result.interface.ts`
- Create: `backend/src/validation/interfaces/constraint-violation.interface.ts`

**Step 1: Generate validation module**

```bash
cd backend
npx nest generate module validation
npx nest generate service validation
```

**Step 2: Create validation result interfaces**

Create `backend/src/validation/interfaces/constraint-violation.interface.ts`:

```typescript
export enum ViolationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface ConstraintViolation {
  severity: ViolationSeverity;
  message: string;
  field?: string;
  details?: any;
}
```

Create `backend/src/validation/interfaces/validation-result.interface.ts`:

```typescript
import { ConstraintViolation } from './constraint-violation.interface';

export interface ValidationResult {
  isValid: boolean;
  violations: ConstraintViolation[];
}
```

**Step 3: Create validation service structure**

Update `backend/src/validation/validation.service.ts`:

```typescript
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
    return [];
  }

  private async validateLeaveConflicts(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }

  private async validateRestPeriods(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }

  private async validateNoOverlaps(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }

  private async validateMinimumPresence(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }

  private async validateVacationQuota(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }

  private async validateTaskRequirements(input: ShiftValidationInput): Promise<ConstraintViolation[]> {
    return [];
  }
}
```

**Step 4: Update validation module**

Update `backend/src/validation/validation.module.ts`:

```typescript
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
```

**Step 5: Commit**

```bash
git add backend/src/validation/
git commit -m "feat: create validation service structure

- Define validation result and constraint violation interfaces
- Create validation service with method stubs
- Set up repository dependencies for all entities
- Prepare for constraint implementation"
```

---

### Task 11: Constraint Validation - Qualifications

**Files:**
- Modify: `backend/src/validation/validation.service.ts`
- Create: `backend/src/validation/validation.service.spec.ts`

**Step 1: Write failing test**

Create `backend/src/validation/validation.service.spec.ts`:

```typescript
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
  });

  it('should reject commander assignment for non-commander soldier', async () => {
    const soldier = { id: '1', isCommander: false, isDriver: false, isSpecialist: false } as Soldier;
    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);

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
    const soldier = { id: '1', isCommander: true, isDriver: false, isSpecialist: false } as Soldier;
    jest.spyOn(soldiersRepository, 'findOne').mockResolvedValue(soldier);

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
```

**Step 2: Run test to verify it fails**

```bash
cd backend
npm test -- validation.service.spec.ts
```

Expected: Tests fail because validateQualifications is not implemented

**Step 3: Implement qualification validation**

Update the `validateQualifications` method in `backend/src/validation/validation.service.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- validation.service.spec.ts
```

Expected: Tests pass

**Step 5: Commit**

```bash
git add backend/src/validation/
git commit -m "feat: implement qualification constraint validation

- Validate commanders, drivers, specialists have correct qualifications
- Return error violations for unqualified assignments
- Add comprehensive unit tests for qualification checks"
```

---

### Task 12: Constraint Validation - Leave Conflicts

**Files:**
- Modify: `backend/src/validation/validation.service.ts`
- Modify: `backend/src/validation/validation.service.spec.ts`

**Step 1: Write failing test**

Add to `backend/src/validation/validation.service.spec.ts`:

```typescript
describe('ValidationService - Leave Conflicts', () => {
  let service: ValidationService;
  let soldiersRepository: Repository<Soldier>;
  let leaveRepository: Repository<LeaveRecord>;

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
    leaveRepository = module.get<Repository<LeaveRecord>>(getRepositoryToken(LeaveRecord));
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
```

**Step 2: Run test to verify it fails**

```bash
npm test -- validation.service.spec.ts
```

Expected: Leave conflict tests fail

**Step 3: Implement leave conflict validation**

Update the `validateLeaveConflicts` method in `backend/src/validation/validation.service.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- validation.service.spec.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add backend/src/validation/
git commit -m "feat: implement leave conflict validation

- Check if soldier is on leave during shift time
- Return error for leave conflicts
- Add unit tests for leave validation"
```

---

Due to length constraints, I'll summarize the remaining tasks. The full implementation would continue with:

### Week 2 Remaining Tasks:
- Task 13: Rest period validation
- Task 14: Overlap detection validation
- Task 15: Minimum presence validation
- Task 16: Vacation quota validation
- Task 17: Leave CRUD endpoints
- Task 18: Deployment CRUD endpoints
- Task 19: Shifts endpoints with validation integration

### Week 3: Frontend Development
- Task 20: Initialize React project
- Task 21: Redux store setup
- Task 22: Auth context and login
- Task 23: Soldiers list and forms
- Task 24: Tasks list and forms
- Task 25: Schedule calendar component
- Task 26: Shift creation modal
- Task 27: Dashboard with presence indicator
- Task 28: Warning panel component
- Task 29: Soldier view

### Week 4: Testing & Deployment
- Task 30: Backend integration tests
- Task 31: Frontend component tests
- Task 32: End-to-end manual testing
- Task 33: Render.com deployment
- Task 34: Vercel deployment
- Task 35: Production smoke testing

Would you like me to continue with the detailed task breakdown for the remaining weeks?