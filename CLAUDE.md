# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shavtzak (שבצ"ק) is a military unit scheduling system - a full-stack monorepo with React frontend and NestJS backend. It automates soldier assignments to shifts with constraint-aware scheduling algorithms. The UI is in Hebrew (RTL).

## Common Commands

### Development
```bash
make dev              # Start everything: PostgreSQL + backend + frontend
make backend          # Backend only (port 3000)
make frontend         # Frontend only (port 5173)
```

### Database
```bash
make db-up            # Start PostgreSQL via Docker
make seed             # Seed database with sample data (70 soldiers, 3 tasks)
make db-reset         # Reset database (destroys all data)
```

### Testing
```bash
# Backend (Jest)
cd backend && npm run test              # Unit tests
cd backend && npm run test:e2e          # E2E tests

# Frontend (Playwright)
cd frontend && npm run test:e2e         # Run E2E tests (requires backend running)
cd frontend && npm run test:e2e:ui      # Playwright UI mode
```

### Running a Single Test
```bash
# Backend - run specific test file
cd backend && npm run test -- soldiers.service.spec.ts

# Frontend - run specific E2E test
cd frontend && npx playwright test soldiers.spec.ts
```

### Linting & Formatting
```bash
cd backend && npm run lint              # ESLint with auto-fix
cd backend && npm run format            # Prettier
cd frontend && npm run lint             # ESLint
```

### Database Migrations
```bash
cd backend && npm run migration:generate -- src/database/migrations/MigrationName
cd backend && npm run migration:run
cd backend && npm run migration:revert
```

## Architecture

### Monorepo Structure
```
shavtzak/
├── frontend/          # React + Vite + shadcn/ui
├── backend/           # NestJS + TypeORM + PostgreSQL
├── docs/plans/        # Design documents
└── docker-compose.yml # PostgreSQL container
```

### Backend Modules (NestJS)

The backend uses NestJS module architecture with global JWT authentication:

- **AuthModule** - Google OAuth + JWT authentication with `@Public()` decorator for open routes
- **UsersModule** - User accounts (admin/editor/viewer roles)
- **SoldiersModule** - Personnel with roles, ranks, constraints (vacation, medical, unavailable)
- **TasksModule** - Shift definitions with TaskRole requirements
- **AssignmentsModule** - Soldier-task bindings + auto-scheduling algorithm
- **PlatoonsModule** - Soldier groupings with auto-assign endpoint
- **SettingsModule** - Global configuration (rest periods, base presence, operational dates)

Global guards in AppModule: `JwtAuthGuard` and `RolesGuard` (use `@Roles()` decorator).

### Frontend Architecture (React)

Provider hierarchy in App.tsx:
```
QueryClientProvider → AuthProvider → TooltipProvider → BrowserRouter
```

Key patterns:
- **React Query hooks** in `src/hooks/` (useSoldiers, useTasks, useAssignments, etc.)
- **Services** in `src/services/` wrap Axios calls to `/api` endpoints
- **shadcn/ui components** in `src/components/ui/` (51 components)
- **Path alias**: `@/` maps to `src/`

### Database Entities

Core relationships:
- **Soldier** → has many **Constraints** (availability restrictions)
- **Soldier** → belongs to **Platoon**
- **Task** → has many **TaskRoles** (required roles with counts)
- **Assignment** → links Soldier to Task with time range and role

### Scheduling Algorithm

Located in `frontend/src/lib/scheduling/fairScheduling.ts`:
1. Validates constraints (vacation, medical, unavailable dates)
2. Enforces rest periods between shifts
3. Prevents consecutive night shifts
4. Distributes assignments fairly based on workload history (prefers soldiers/platoons with fewer hours)
5. Matches required roles with soldier capabilities
6. Supports locked assignments that won't be changed

Tests in `frontend/src/lib/scheduling/__tests__/` (48 tests covering correctness, fairness, and multi-week simulations).

## Key URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/api/docs
- Database: localhost:5432 (postgres/postgres/shabtzaq)

## Code Conventions

- Backend uses NestJS decorators: `@Controller`, `@Injectable`, `@Entity`
- DTOs use class-validator decorators for validation
- Frontend uses Zod schemas for form validation
- TypeORM entities use decorators: `@Entity`, `@Column`, `@OneToMany`, etc.
- Global validation pipe auto-transforms and whitelists request bodies

## Pre-Push Checklist

**IMPORTANT**: Run all CI checks locally before pushing to verify everything passes.

```bash
# Backend checks
cd backend
npm run lint                    # ESLint
npm run format                  # Prettier
npm run build                   # TypeScript compilation
npm run test                    # Unit tests

# Frontend checks
cd frontend
npm run lint                    # ESLint
npm run build                   # Vite build
npm run test                    # Vitest unit tests

# Full E2E (requires running backend)
make dev                        # Start all services
cd frontend && npm run test:e2e # Playwright E2E tests
```

All checks must pass before committing and pushing.