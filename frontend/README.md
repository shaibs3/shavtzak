# שבצ״ק - Shavtzak Scheduling System

<div align="center">

![Shavtzak Logo](frontend/public/lavi-logo.png)

**Military Unit Scheduling & Assignment Management System**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture) • [API](#api-documentation)

</div>

---

## Overview

Shavtzak (שבצ״ק - Scheduling) is a comprehensive military unit scheduling system designed to automate soldier assignments to shifts and tasks. Built with modern web technologies, it provides an intuitive Hebrew interface for managing personnel, defining tasks, and generating fair, constraint-aware schedules.

### Key Capabilities

- 📋 **Smart Scheduling**: Automatic assignment algorithm considering constraints, rest periods, and fairness
- 👥 **Personnel Management**: Complete CRUD operations for soldiers with roles, ranks, and vacation tracking
- 📅 **Constraint System**: Manage soldier availability (vacation, medical, etc.)
- 🔄 **Real-time Updates**: React Query ensures data consistency across the application
- 📊 **Fairness Analytics**: Visual histogram showing work distribution
- 🌐 **Full Stack**: Integrated frontend-backend with PostgreSQL persistence

---

## Features

### Soldier Management
- Add, edit, and delete soldiers
- Multiple roles per soldier (Commander, Driver, Radio Operator, Soldier)
- Vacation day tracking (used/maximum)
- Constraint management (unavailable dates, vacation periods, medical leave)

### Task Management
- Define shift-based tasks with start times and durations
- Required roles per task (e.g., "2 soldiers, 1 radio operator")
- Active/inactive task toggling
- Rest period requirements between shifts

### Intelligent Scheduling
- **Auto-scheduling algorithm** that:
  - Respects soldier constraints (unavailable dates)
  - Enforces rest periods between shifts
  - Distributes workload fairly across all personnel
  - Considers role requirements for each task
  - Maintains minimum base presence
- Manual assignment override capability
- Lock assignments to prevent auto-scheduler changes

### Settings & Configuration
- Total soldiers in unit
- Minimum base presence percentage
- System-wide defaults

### Dashboard Analytics
- Total soldier count and distribution
- Active constraints overview
- Recent assignments
- Vacation usage statistics

---

## Tech Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Query (@tanstack/react-query)** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **shadcn/ui** - Component library (Radix UI primitives)
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **Playwright** - E2E testing

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe backend
- **TypeORM** - Object-relational mapping
- **PostgreSQL** - Relational database
- **Class Validator** - DTO validation

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **GitHub Actions** - CI/CD (optional)

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shaibs3/shavtzak.git
   cd shavtzak-integration
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb shavtzak
   ```

2. **Configure database connection**

   Create `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=shavtzak
   ```

3. **Run migrations** (if any)
   ```bash
   cd backend
   npm run migration:run
   ```

4. **Seed initial data**
   ```bash
   npm run seed
   ```

   This creates:
   - 70 soldiers with realistic Hebrew names
   - 2 default tasks (morning & evening shifts)
   - Sample constraints (~20% of soldiers)

### Frontend Configuration

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Backend runs on: http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:8080

**Open in browser:** http://localhost:8080

---

## Project Structure

```
shavtzak-integration/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── soldiers/          # Soldier module (CRUD + constraints)
│   │   ├── tasks/             # Task module (CRUD)
│   │   ├── assignments/       # Assignment module (CRUD)
│   │   ├── settings/          # Settings module
│   │   ├── database/          # Database configuration & seeds
│   │   └── main.ts            # Application entry point
│   ├── test/                  # E2E tests
│   └── package.json
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── soldiers/      # Soldier management UI
│   │   │   ├── tasks/         # Task management UI
│   │   │   ├── schedule/      # Scheduling UI
│   │   │   ├── settings/      # Settings UI
│   │   │   ├── dashboard/     # Dashboard UI
│   │   │   └── layout/        # Layout components
│   │   ├── hooks/             # React Query hooks
│   │   │   ├── useSoldiers.ts
│   │   │   ├── useTasks.ts
│   │   │   ├── useAssignments.ts
│   │   │   └── useSettings.ts
│   │   ├── services/          # API service layer
│   │   │   ├── api.ts         # Axios client
│   │   │   ├── soldiers.service.ts
│   │   │   ├── tasks.service.ts
│   │   │   ├── assignments.service.ts
│   │   │   └── settings.service.ts
│   │   ├── lib/               # Utilities
│   │   │   └── scheduling/    # Auto-scheduling algorithm
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Root component
│   ├── tests/e2e/             # Playwright E2E tests
│   └── package.json
│
└── docs/                       # Documentation
    ├── plans/                  # Implementation plans
    └── design/                 # Architecture design docs
```

---

## Architecture

### Frontend Architecture

```
┌─────────────────────────────────────────────┐
│           React Components                  │
│  (SoldiersView, TasksView, ScheduleView)   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         React Query Hooks                   │
│  (useSoldiers, useTasks, useAssignments)   │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Service Layer                      │
│   (soldiers.service, tasks.service)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Axios Client                       │
│     (Error interceptors, base config)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              REST API (Backend)
```

### Backend Architecture

```
┌─────────────────────────────────────────────┐
│         NestJS Controllers                  │
│   (SoldiersController, TasksController)    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Services Layer                    │
│  (Business logic, validation)               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          TypeORM Repository                 │
│     (Database abstraction)                  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
              PostgreSQL
```

### Data Flow

1. User interacts with React component
2. Component calls React Query hook (e.g., `useCreateSoldier`)
3. Hook invokes service method (e.g., `soldiersService.create()`)
4. Service makes HTTP request via Axios
5. Backend controller receives request
6. Service processes business logic
7. TypeORM persists to PostgreSQL
8. Response flows back through layers
9. React Query updates cache
10. Component re-renders with new data

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Soldiers

#### Get All Soldiers
```http
GET /soldiers
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "יוסי כהן",
    "rank": "סמל",
    "roles": ["soldier", "driver"],
    "maxVacationDays": 7,
    "usedVacationDays": 2,
    "constraints": [...]
  }
]
```

#### Create Soldier
```http
POST /soldiers
Content-Type: application/json

{
  "name": "דני לוי",
  "rank": "טוראי",
  "roles": ["soldier"],
  "maxVacationDays": 5,
  "usedVacationDays": 0
}
```

#### Update Soldier
```http
PATCH /soldiers/:id
Content-Type: application/json

{
  "rank": "רב טוראי",
  "usedVacationDays": 3
}
```

#### Delete Soldier
```http
DELETE /soldiers/:id
```

#### Add Constraint
```http
POST /soldiers/:soldierId/constraints
Content-Type: application/json

{
  "type": "vacation",
  "startDate": "2026-02-01",
  "endDate": "2026-02-07",
  "reason": "חופשה שנתית"
}
```

#### Remove Constraint
```http
DELETE /soldiers/:soldierId/constraints/:constraintId
```

### Tasks

#### Get All Tasks
```http
GET /tasks
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "name": "משמרת בוקר",
  "description": "שמירה 06:00-14:00",
  "shiftStartHour": 6,
  "shiftDuration": 8,
  "restTimeBetweenShifts": 12,
  "isActive": true,
  "requiredRoles": [
    { "role": "soldier", "count": 2 },
    { "role": "commander", "count": 1 }
  ]
}
```

#### Update Task
```http
PATCH /tasks/:id
Content-Type: application/json

{
  "isActive": false
}
```

#### Delete Task
```http
DELETE /tasks/:id
```

### Assignments

#### Get All Assignments
```http
GET /assignments
```

#### Create Assignment
```http
POST /assignments
Content-Type: application/json

{
  "taskId": "uuid",
  "soldierId": "uuid",
  "role": "soldier",
  "startTime": "2026-01-25T06:00:00Z",
  "endTime": "2026-01-25T14:00:00Z",
  "locked": false
}
```

#### Delete Assignment
```http
DELETE /assignments/:id
```

### Settings

#### Get Settings
```http
GET /settings
```

#### Update Settings
```http
PATCH /settings
Content-Type: application/json

{
  "minBasePresence": 80,
  "totalSoldiers": 70
}
```

---

## Testing

### Unit Tests (Frontend)
```bash
cd frontend
npm run test
```

### E2E Tests (Frontend)
```bash
cd frontend
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run in headed mode
```

**Test Coverage:**
- ✅ Soldiers CRUD operations
- ✅ Tasks CRUD operations
- ✅ Settings management
- ✅ Schedule view and navigation
- ✅ Auto-scheduling
- ✅ Error handling and recovery

### Backend Tests
```bash
cd backend
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report
```

---

## Auto-Scheduling Algorithm

The system includes an intelligent scheduling algorithm (`frontend/src/lib/scheduling/fairScheduling.ts`) that:

### Features
1. **Constraint Awareness**: Respects soldier unavailability (vacation, medical, etc.)
2. **Rest Periods**: Ensures minimum rest time between shifts
3. **Fair Distribution**: Tracks and balances workload across all soldiers
4. **Role Matching**: Only assigns soldiers with required roles
5. **Base Presence**: Maintains minimum staffing levels

### Algorithm Flow
```
1. For each day in the week:
   2. For each active task:
      3. For each required role:
         4. Filter available soldiers:
            - Has required role
            - Not constrained on this date
            - Has sufficient rest since last shift
         5. Sort by workload (least assigned first)
         6. Assign soldier with lowest workload
         7. Update workload tracker
      8. If any role unfilled, mark as unfilled slot
9. Return assignments and unfilled count
```

---

## Development

### Code Style
- ESLint configuration included
- Prettier for formatting
- TypeScript strict mode enabled

### Commit Conventions
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
test: Test additions/modifications
refactor: Code refactoring
style: Formatting changes
chore: Build/tooling changes
```

### Branch Strategy
- `main` - Production-ready code
- `integration/*` - Feature branches
- `fix/*` - Bug fix branches

---

## Deployment

### Frontend (Vercel/Netlify)
1. Build production bundle:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy `dist/` folder

3. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-api.com/api
   ```

### Backend (Heroku/Railway/Fly.io)
1. Set environment variables:
   ```
   DB_HOST=your-db-host
   DB_PORT=5432
   DB_USERNAME=your-db-user
   DB_PASSWORD=your-db-pass
   DB_DATABASE=shavtzak
   ```

2. Deploy via platform CLI or Git integration

---

## Known Issues

- E2E tests: 15/21 tests need toast timing adjustments
- Auto-scheduler may not fill all slots with extreme constraints
- Hebrew text rendering requires proper font support

---

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Multi-unit support
- [ ] Export schedules to PDF/Excel
- [ ] WebSocket for real-time updates
- [ ] Mobile app (React Native)
- [ ] Email notifications for assignments
- [ ] Advanced conflict resolution UI
- [ ] Historical analytics and reporting
- [ ] Integration with military HR systems

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) component library
- Inspired by military unit scheduling challenges
- Uses [Radix UI](https://www.radix-ui.com/) primitives

---

## Support

For issues, questions, or contributions, please open an issue on GitHub:
https://github.com/shaibs3/shavtzak/issues

---

<div align="center">

**שבצ״ק** - Built with ❤️ for military units

[⬆ Back to top](#שבצק---shavtzak-scheduling-system)

</div>
