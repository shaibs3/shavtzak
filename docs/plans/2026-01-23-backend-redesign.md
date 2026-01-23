# Backend Redesign - Duty Scheduler

**Date:** 2026-01-23
**Status:** Design Approved
**Approach:** Complete rewrite with NestJS + TypeORM + PostgreSQL

## Overview

Complete backend rewrite to match the new shadcn-ui frontend. Start with minimal CRUD operations for core entities (Soldiers, Tasks, Assignments, Settings), then layer on scheduling logic and validation in future iterations.

## Architecture

### Tech Stack
- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Auth:** JWT (minimal, keep from existing setup)
- **Docs:** Swagger (auto-generated)

### Design Principles
1. **UI-driven schema:** Entities mirror TypeScript types from frontend
2. **CRUD first:** Basic operations before complex scheduling logic
3. **Modular:** Separate NestJS modules per domain
4. **Type-safe:** DTOs with class-validator for all inputs
5. **Seeded data:** Hebrew sample data for immediate testing

## Project Structure

```
backend/src/
├── main.ts                    # Bootstrap application
├── app.module.ts              # Root module
├── config/
│   └── database.config.ts     # TypeORM configuration
├── soldiers/
│   ├── soldiers.module.ts
│   ├── soldiers.controller.ts
│   ├── soldiers.service.ts
│   ├── entities/
│   │   ├── soldier.entity.ts
│   │   └── constraint.entity.ts
│   └── dto/
│       ├── create-soldier.dto.ts
│       ├── update-soldier.dto.ts
│       └── create-constraint.dto.ts
├── tasks/
│   ├── tasks.module.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   ├── entities/
│   │   ├── task.entity.ts
│   │   └── task-role.entity.ts
│   └── dto/
│       ├── create-task.dto.ts
│       └── update-task.dto.ts
├── assignments/
│   ├── assignments.module.ts
│   ├── assignments.controller.ts
│   ├── assignments.service.ts
│   ├── entities/
│   │   └── assignment.entity.ts
│   └── dto/
│       ├── create-assignment.dto.ts
│       └── update-assignment.dto.ts
├── settings/
│   ├── settings.module.ts
│   ├── settings.controller.ts
│   ├── settings.service.ts
│   ├── entities/
│   │   └── settings.entity.ts
│   └── dto/
│       └── update-settings.dto.ts
└── database/
    └── seeds/
        └── initial-data.seed.ts
```

## Database Schema

### Soldier Entity

```typescript
@Entity('soldiers')
export class Soldier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  rank: string;

  @Column('simple-array')  // ['commander', 'driver', 'radio_operator', 'soldier']
  roles: string[];

  @Column({ type: 'int', default: 5 })
  maxVacationDays: number;

  @Column({ type: 'int', default: 0 })
  usedVacationDays: number;

  @OneToMany(() => Constraint, constraint => constraint.soldier, { cascade: true })
  constraints: Constraint[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Constraint Entity

```typescript
@Entity('constraints')
export class Constraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;  // 'unavailable' | 'vacation' | 'medical' | 'other'

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => Soldier, soldier => soldier.constraints, { onDelete: 'CASCADE' })
  soldier: Soldier;

  @CreateDateColumn()
  createdAt: Date;
}
```

**Relationships:** Soldier has many Constraints (one-to-many with cascade delete)

### Task Entity

```typescript
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int' })  // 0-23
  shiftStartHour: number;

  @Column({ type: 'int' })
  shiftDuration: number;

  @Column({ type: 'int' })
  restTimeBetweenShifts: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => TaskRole, taskRole => taskRole.task, { cascade: true })
  requiredRoles: TaskRole[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### TaskRole Entity

```typescript
@Entity('task_roles')
export class TaskRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;  // 'commander' | 'driver' | 'radio_operator' | 'soldier'

  @Column({ type: 'int' })
  count: number;

  @ManyToOne(() => Task, task => task.requiredRoles, { onDelete: 'CASCADE' })
  task: Task;
}
```

**Relationships:** Task has many TaskRoles (one-to-many with cascade delete)

### Assignment Entity

```typescript
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

**Note:** References soldiers/tasks by ID but no foreign key constraints for flexibility

### Settings Entity

```typescript
@Entity('settings')
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })  // percentage
  minBasePresence: number;

  @Column({ type: 'int' })
  totalSoldiers: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Note:** Singleton pattern - only one row in the table

## REST API Endpoints

### Soldiers Module

```
GET    /api/soldiers                            # List all soldiers
GET    /api/soldiers/:id                        # Get soldier by id
POST   /api/soldiers                            # Create soldier
PATCH  /api/soldiers/:id                        # Update soldier
DELETE /api/soldiers/:id                        # Delete soldier
POST   /api/soldiers/:id/constraints            # Add constraint
DELETE /api/soldiers/:id/constraints/:constraintId  # Remove constraint
```

### Tasks Module

```
GET    /api/tasks                               # List all tasks
GET    /api/tasks/:id                           # Get task by id
POST   /api/tasks                               # Create task
PATCH  /api/tasks/:id                           # Update task
DELETE /api/tasks/:id                           # Delete task
```

### Assignments Module

```
GET    /api/assignments                         # List all assignments
GET    /api/assignments/:id                     # Get assignment by id
POST   /api/assignments                         # Create assignment
DELETE /api/assignments/:id                     # Delete assignment
PATCH  /api/assignments/:id                     # Update assignment (for locking)
```

### Settings Module

```
GET    /api/settings                            # Get settings (singleton)
PATCH  /api/settings                            # Update settings
```

### Response Format

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "message": "Error description",
  "error": "ErrorType"
}
```

## Seed Data

Initial Hebrew sample data from the UI:

### Soldiers
```typescript
[
  {
    name: 'יוסי כהן',
    rank: 'סמל',
    roles: ['driver', 'soldier'],
    maxVacationDays: 5,
    usedVacationDays: 1,
    constraints: []
  },
  {
    name: 'דני לוי',
    rank: 'רב"ט',
    roles: ['commander', 'soldier'],
    maxVacationDays: 5,
    usedVacationDays: 0,
    constraints: []
  },
  {
    name: 'משה ישראלי',
    rank: 'טוראי',
    roles: ['radio_operator', 'soldier'],
    maxVacationDays: 5,
    usedVacationDays: 2,
    constraints: []
  }
]
```

### Tasks
```typescript
[
  {
    name: 'שמירה בשער',
    description: 'משמרת שמירה בכניסה הראשית',
    requiredRoles: [
      { role: 'commander', count: 1 },
      { role: 'soldier', count: 2 }
    ],
    shiftStartHour: 8,
    shiftDuration: 8,
    restTimeBetweenShifts: 12,
    isActive: true
  },
  {
    name: 'סיור',
    description: 'סיור מבצעי בגזרה',
    requiredRoles: [
      { role: 'commander', count: 1 },
      { role: 'driver', count: 1 },
      { role: 'radio_operator', count: 1 },
      { role: 'soldier', count: 2 }
    ],
    shiftStartHour: 8,
    shiftDuration: 6,
    restTimeBetweenShifts: 8,
    isActive: true
  }
]
```

### Settings
```typescript
{
  minBasePresence: 75,
  totalSoldiers: 20
}
```

## Implementation Plan

### Phase 1: Backend Setup
1. Clean backend directory (delete old modules)
2. Configure TypeORM connection to PostgreSQL
3. Update app.module.ts with new structure
4. Enable Swagger documentation

### Phase 2: Create Entities
5. Create Soldier and Constraint entities
6. Create Task and TaskRole entities
7. Create Assignment entity
8. Create Settings entity
9. Run TypeORM sync to generate database schema

### Phase 3: Build Modules (in order)
10. Generate Soldiers module (module, controller, service)
11. Create Soldier DTOs with validation
12. Implement Soldiers CRUD endpoints
13. Generate Tasks module
14. Create Task DTOs with validation
15. Implement Tasks CRUD endpoints
16. Generate Assignments module
17. Create Assignment DTOs with validation
18. Implement Assignments CRUD endpoints
19. Generate Settings module
20. Create Settings DTOs with validation
21. Implement Settings endpoints

### Phase 4: Seed Data
22. Create seed script with Hebrew sample data
23. Run seed script to populate initial data

### Phase 5: Frontend Integration
24. Install React Query in frontend (already in package.json)
25. Create API client service
26. Replace Zustand actions with React Query mutations
27. Update components to use React Query hooks
28. Remove localStorage persistence

### Phase 6: Testing & Validation
29. Test all endpoints via Swagger
30. Test full CRUD operations from UI
31. Verify data persistence
32. Test error handling

## Future Enhancements (Out of Scope)

These will be added in future iterations:
- Auto-scheduling algorithm
- Fairness calculation and histogram data
- Constraint validation (vacation limits, rest time)
- Conflict detection
- Schedule optimization
- Advanced filtering and search
- Bulk operations
- Export/import functionality

## Success Criteria

Backend is complete when:
1. All CRUD endpoints working
2. Database properly seeded with Hebrew data
3. Frontend successfully reads and writes to backend
4. All entities properly related in database
5. Swagger documentation accessible
6. No console errors in backend or frontend

## Notes

- Start with synchronize: true in TypeORM for development
- Move to migrations for production
- Keep API responses simple and consistent
- Focus on correctness over optimization initially
- Use UUIDs for all primary keys to match frontend
