# Google OAuth Authentication Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google OAuth authentication with admin/viewer roles, where admins can manage user roles.

**Architecture:** Google OAuth for login → JWT for session → Role-based guards on write endpoints. First user becomes admin automatically. Admins can promote/demote users via a management UI.

**Tech Stack:** NestJS + Passport + passport-google-oauth20 + JWT | React + React Query | PostgreSQL

---

## Task 1: Install Google OAuth Dependencies

**Files:**
- Modify: `backend/package.json`

**Step 1: Install passport-google-oauth20**

```bash
cd backend && npm install passport-google-oauth20 @types/passport-google-oauth20
```

**Step 2: Verify installation**

Run: `cat backend/package.json | grep google`
Expected: `"passport-google-oauth20": "^2.x.x"`

**Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore: add passport-google-oauth20 dependency"
```

---

## Task 2: Create User Entity

**Files:**
- Create: `backend/src/users/entities/user.entity.ts`
- Modify: `backend/src/database/data-source.ts`

**Step 1: Create the User entity file**

```typescript
// backend/src/users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'viewer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ unique: true })
  googleId: string;

  @Column({ type: 'varchar', default: 'viewer' })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Step 2: Add User to data-source.ts entities array**

In `backend/src/database/data-source.ts`, add import and entity:

```typescript
import { User } from '../users/entities/user.entity';

// In entities array, add:
entities: [Settings, Soldier, Constraint, Task, TaskRole, Assignment, Platoon, User],
```

**Step 3: Commit**

```bash
git add backend/src/users/entities/user.entity.ts backend/src/database/data-source.ts
git commit -m "feat(auth): add User entity with Google OAuth fields"
```

---

## Task 3: Create Users Migration

**Files:**
- Create: `backend/src/database/migrations/[timestamp]-CreateUsersTable.ts`

**Step 1: Create migration file**

```typescript
// backend/src/database/migrations/1739000000000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1739000000000 implements MigrationInterface {
  name = 'CreateUsersTable1739000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('users');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'email',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
            },
            {
              name: 'picture',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'googleId',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'role',
              type: 'varchar',
              default: "'viewer'",
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
```

**Step 2: Run migration**

```bash
cd backend && npm run migration:run
```

Expected: Migration runs successfully, `users` table created.

**Step 3: Commit**

```bash
git add backend/src/database/migrations/*CreateUsersTable*
git commit -m "feat(auth): add users table migration"
```

---

## Task 4: Create Users Module and Service

**Files:**
- Create: `backend/src/users/users.module.ts`
- Create: `backend/src/users/users.service.ts`
- Create: `backend/src/users/dto/update-user-role.dto.ts`

**Step 1: Create UsersService**

```typescript
// backend/src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createFromGoogle(profile: GoogleProfile): Promise<User> {
    // Check if this is the first user - make them admin
    const userCount = await this.usersRepository.count();
    const role: UserRole = userCount === 0 ? 'admin' : 'viewer';

    const user = this.usersRepository.create({
      googleId: profile.id,
      email: profile.email,
      name: profile.displayName,
      picture: profile.picture,
      role,
    });

    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }

  async countAdmins(): Promise<number> {
    return this.usersRepository.count({ where: { role: 'admin' } });
  }
}
```

**Step 2: Create UpdateUserRoleDto**

```typescript
// backend/src/users/dto/update-user-role.dto.ts
import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin', enum: ['admin', 'viewer'] })
  @IsIn(['admin', 'viewer'])
  role: 'admin' | 'viewer';
}
```

**Step 3: Create UsersModule**

```typescript
// backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**Step 4: Commit**

```bash
git add backend/src/users/
git commit -m "feat(auth): add Users module and service"
```

---

## Task 5: Create Auth Module with Google Strategy

**Files:**
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/strategies/google.strategy.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/auth/decorators/current-user.decorator.ts`

**Step 1: Create Google Strategy**

```typescript
// backend/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    const user = {
      id,
      email: emails[0].value,
      displayName,
      picture: photos?.[0]?.value,
    };
    done(null, user);
  }
}
```

**Step 2: Create JWT Strategy**

```typescript
// backend/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

**Step 3: Create JWT Auth Guard**

```typescript
// backend/src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

**Step 4: Create Roles Guard**

```typescript
// backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**Step 5: Create Decorators**

```typescript
// backend/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// backend/src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// backend/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Step 6: Create Auth Service**

```typescript
// backend/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, GoogleProfile } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    let user = await this.usersService.findByGoogleId(profile.id);
    if (!user) {
      user = await this.usersService.createFromGoogle(profile);
    }
    return user;
  }

  generateJwt(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
```

**Step 7: Create Auth Controller**

```typescript
// backend/src/auth/auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const user = await this.authService.validateGoogleUser(req.user);
    const token = this.authService.generateJwt(user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
    };
  }
}
```

**Step 8: Create Auth Module**

```typescript
// backend/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Step 9: Commit**

```bash
git add backend/src/auth/
git commit -m "feat(auth): add Auth module with Google OAuth and JWT strategies"
```

---

## Task 6: Create Users Controller for Admin Management

**Files:**
- Create: `backend/src/users/users.controller.ts`
- Modify: `backend/src/users/users.module.ts`

**Step 1: Create UsersController**

```typescript
// backend/src/users/users.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    // Prevent admin from demoting themselves if they're the last admin
    if (id === currentUser.id && dto.role === 'viewer') {
      const adminCount = await this.usersService.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }
    return this.usersService.updateRole(id, dto.role);
  }
}
```

**Step 2: Update UsersModule to include controller**

```typescript
// backend/src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

**Step 3: Commit**

```bash
git add backend/src/users/
git commit -m "feat(auth): add Users controller with admin role management"
```

---

## Task 7: Integrate Auth into App Module and Apply Global Guards

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

**Step 1: Update app.module.ts**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { SoldiersModule } from './soldiers/soldiers.module';
import { TasksModule } from './tasks/tasks.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SettingsModule } from './settings/settings.module';
import { PlatoonsModule } from './platoons/platoons.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UsersModule,
    SoldiersModule,
    TasksModule,
    AssignmentsModule,
    SettingsModule,
    PlatoonsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

**Step 2: Commit**

```bash
git add backend/src/app.module.ts
git commit -m "feat(auth): integrate Auth module and apply global guards"
```

---

## Task 8: Add @Roles('admin') to Write Endpoints

**Files:**
- Modify: `backend/src/soldiers/soldiers.controller.ts`
- Modify: `backend/src/tasks/tasks.controller.ts`
- Modify: `backend/src/assignments/assignments.controller.ts`
- Modify: `backend/src/settings/settings.controller.ts`
- Modify: `backend/src/platoons/platoons.controller.ts`

**Step 1: Update SoldiersController**

Add import at top:
```typescript
import { Roles } from '../auth/decorators/roles.decorator';
```

Add `@Roles('admin')` decorator to:
- `create()` method (POST)
- `update()` method (PATCH)
- `remove()` method (DELETE)
- `bulkUpdate()` method (PATCH bulk)
- Any other write operations

**Step 2: Apply same pattern to other controllers**

For each controller, add `@Roles('admin')` to all POST, PUT, PATCH, DELETE methods.
GET methods remain accessible to all authenticated users.

**Step 3: Commit**

```bash
git add backend/src/soldiers/soldiers.controller.ts backend/src/tasks/tasks.controller.ts backend/src/assignments/assignments.controller.ts backend/src/settings/settings.controller.ts backend/src/platoons/platoons.controller.ts
git commit -m "feat(auth): protect write endpoints with admin role"
```

---

## Task 9: Update Backend Environment Variables

**Files:**
- Modify: `backend/.env`
- Create: `backend/.env.example`

**Step 1: Update .env with Google OAuth variables**

Add to `backend/.env`:
```
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL for redirect after auth
FRONTEND_URL=http://localhost:8080
```

**Step 2: Create .env.example**

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=shavtzak

# JWT
JWT_SECRET=change-this-to-a-secure-secret
JWT_EXPIRATION=24h

# Server
PORT=3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:8080
```

**Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "docs: add .env.example with Google OAuth variables"
```

---

## Task 10: Create Frontend Auth Types

**Files:**
- Create: `frontend/src/types/auth.ts`

**Step 1: Create auth types**

```typescript
// frontend/src/types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: 'admin' | 'viewer';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Step 2: Commit**

```bash
git add frontend/src/types/auth.ts
git commit -m "feat(auth): add frontend auth types"
```

---

## Task 11: Create Frontend Auth Service

**Files:**
- Create: `frontend/src/services/auth.service.ts`

**Step 1: Create auth service**

```typescript
// frontend/src/services/auth.service.ts
import { apiClient } from './api';
import type { User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },

  getMe: () => apiClient.get<User>('/auth/me'),

  getGoogleAuthUrl: (): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    return `${baseUrl}/auth/google`;
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '/login';
  },
};
```

**Step 2: Commit**

```bash
git add frontend/src/services/auth.service.ts
git commit -m "feat(auth): add frontend auth service"
```

---

## Task 12: Update API Client to Include Auth Token

**Files:**
- Modify: `frontend/src/services/api.ts`

**Step 1: Add request interceptor for auth token**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'שגיאה בתקשורת עם השרת';
    toast({
      variant: 'destructive',
      title: 'שגיאה',
      description: Array.isArray(message) ? message.join(', ') : message,
    });
    return Promise.reject(error);
  }
);
```

**Step 2: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat(auth): add auth token interceptor to API client"
```

---

## Task 13: Create Auth Context and Hook

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`
- Create: `frontend/src/hooks/useAuth.ts`

**Step 1: Create AuthContext**

```typescript
// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/auth.service';
import type { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: authService.getToken(),
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      authService
        .getMe()
        .then((response) => {
          setState({
            user: response.data,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        })
        .catch(() => {
          authService.removeToken();
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = () => {
    window.location.href = authService.getGoogleAuthUrl();
  };

  const logout = () => {
    authService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        isAdmin: state.user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 2: Create useAuth hook file (re-export)**

```typescript
// frontend/src/hooks/useAuth.ts
export { useAuth } from '@/contexts/AuthContext';
```

**Step 3: Commit**

```bash
git add frontend/src/contexts/AuthContext.tsx frontend/src/hooks/useAuth.ts
git commit -m "feat(auth): add AuthContext and useAuth hook"
```

---

## Task 14: Create Login Page

**Files:**
- Create: `frontend/src/pages/Login.tsx`

**Step 1: Create Login page**

```typescript
// frontend/src/pages/Login.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-card rounded-xl shadow-card text-center">
        <h1 className="text-2xl font-bold mb-2">שבצ״ק</h1>
        <p className="text-muted-foreground mb-8">מערכת ניהול תורנויות ושיבוצים</p>

        <Button onClick={login} className="w-full gap-2" size="lg">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          התחבר עם Google
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/Login.tsx
git commit -m "feat(auth): add Login page with Google sign-in"
```

---

## Task 15: Create Auth Callback Page

**Files:**
- Create: `frontend/src/pages/AuthCallback.tsx`

**Step 1: Create callback page**

```typescript
// frontend/src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      authService.setToken(token);
      window.location.href = '/'; // Full reload to refresh auth state
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">מתחבר...</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/AuthCallback.tsx
git commit -m "feat(auth): add AuthCallback page for OAuth redirect"
```

---

## Task 16: Create Protected Route Component

**Files:**
- Create: `frontend/src/components/auth/ProtectedRoute.tsx`

**Step 1: Create ProtectedRoute**

```typescript
// frontend/src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/auth/ProtectedRoute.tsx
git commit -m "feat(auth): add ProtectedRoute component"
```

---

## Task 17: Update App Routing

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Update App.tsx with auth routes**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import { Login } from '@/pages/Login';
import { AuthCallback } from '@/pages/AuthCallback';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

**Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(auth): update routing with protected routes and auth pages"
```

---

## Task 18: Add User Menu to Header

**Files:**
- Modify: `frontend/src/pages/Index.tsx`

**Step 1: Add user menu with logout**

In the header section of Index.tsx, add a user menu that shows:
- User avatar/picture
- User name
- Role badge (admin/viewer)
- Logout button

Use `useAuth()` hook to get user info and logout function.

**Step 2: Commit**

```bash
git add frontend/src/pages/Index.tsx
git commit -m "feat(auth): add user menu to header with logout"
```

---

## Task 19: Create Users Management Page

**Files:**
- Create: `frontend/src/services/users.service.ts`
- Create: `frontend/src/hooks/useUsers.ts`
- Create: `frontend/src/components/users/UsersView.tsx`

**Step 1: Create users service**

```typescript
// frontend/src/services/users.service.ts
import { apiClient } from './api';
import type { User } from '@/types/auth';

export const usersService = {
  getAll: () => apiClient.get<User[]>('/users'),
  updateRole: (id: string, role: 'admin' | 'viewer') =>
    apiClient.patch<User>(`/users/${id}/role`, { role }),
};
```

**Step 2: Create useUsers hook**

```typescript
// frontend/src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';
import { toast } from '@/hooks/use-toast';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersService.getAll();
      return response.data;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'viewer' }) =>
      usersService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'התפקיד עודכן בהצלחה' });
    },
  });
};
```

**Step 3: Create UsersView component**

```typescript
// frontend/src/components/users/UsersView.tsx
import { useUsers, useUpdateUserRole } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function UsersView() {
  const { data: users = [], isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const { user: currentUser } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center">טוען...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">ניהול משתמשים</h2>
        <p className="text-muted-foreground mt-1">נהל הרשאות משתמשים במערכת</p>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium">משתמש</th>
              <th className="px-4 py-3 text-right text-sm font-medium">אימייל</th>
              <th className="px-4 py-3 text-right text-sm font-medium">תפקיד</th>
              <th className="px-4 py-3 text-right text-sm font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="font-medium">{user.name}</span>
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="text-xs">את/ה</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'מנהל' : 'צופה'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onValueChange={(role: 'admin' | 'viewer') =>
                      updateRole.mutate({ id: user.id, role })
                    }
                    disabled={user.id === currentUser?.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">מנהל</SelectItem>
                      <SelectItem value="viewer">צופה</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add frontend/src/services/users.service.ts frontend/src/hooks/useUsers.ts frontend/src/components/users/UsersView.tsx
git commit -m "feat(auth): add users management page for admins"
```

---

## Task 20: Add Users Tab to Navigation (Admin Only)

**Files:**
- Modify: `frontend/src/pages/Index.tsx`

**Step 1: Add users tab**

In Index.tsx:
1. Import `UsersView` component
2. Import `useAuth` hook
3. Add "users" tab to navigation (only visible for admins)
4. Add case for "users" in the switch statement

**Step 2: Commit**

```bash
git add frontend/src/pages/Index.tsx
git commit -m "feat(auth): add users management tab for admins"
```

---

## Task 21: Hide Edit Buttons for Viewers

**Files:**
- Modify: `frontend/src/components/soldiers/SoldiersView.tsx`
- Modify: `frontend/src/components/tasks/TasksView.tsx`
- Modify: `frontend/src/components/settings/SettingsView.tsx`
- Modify: `frontend/src/components/schedule/ScheduleView.tsx`

**Step 1: Update components to check isAdmin**

In each component:
1. Import `useAuth` from hooks
2. Get `isAdmin` from `useAuth()`
3. Wrap add/edit/delete buttons with `{isAdmin && (...)}`

Example pattern:
```typescript
const { isAdmin } = useAuth();

// In JSX:
{isAdmin && (
  <Button onClick={handleAdd}>
    <Plus className="w-4 h-4" />
    הוסף
  </Button>
)}
```

**Step 2: Commit**

```bash
git add frontend/src/components/soldiers/SoldiersView.tsx frontend/src/components/tasks/TasksView.tsx frontend/src/components/settings/SettingsView.tsx frontend/src/components/schedule/ScheduleView.tsx
git commit -m "feat(auth): hide edit controls from viewers"
```

---

## Task 22: Setup Google OAuth Credentials

**Manual Steps (not code):**

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret
8. Add to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

---

## Task 23: Test the Full Authentication Flow

**Step 1: Start the backend**

```bash
cd backend && npm run start:dev
```

**Step 2: Start the frontend**

```bash
cd frontend && npm run dev
```

**Step 3: Test login flow**

1. Open http://localhost:8080
2. Should redirect to /login
3. Click "התחבר עם Google"
4. Complete Google sign-in
5. Should redirect back and show dashboard
6. First user should be admin

**Step 4: Test role restrictions**

1. As admin, verify all edit buttons visible
2. Create another user (sign in from different Google account)
3. New user should be viewer
4. Viewer should see read-only UI
5. Admin can change viewer's role in Users tab

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(auth): complete Google OAuth implementation with admin/viewer roles"
```

---

## Summary

This implementation provides:
- ✅ Google OAuth authentication
- ✅ JWT-based sessions
- ✅ Admin/Viewer role system
- ✅ First user becomes admin automatically
- ✅ Admins can manage user roles
- ✅ Protected API endpoints
- ✅ Protected frontend routes
- ✅ Viewers see read-only UI
