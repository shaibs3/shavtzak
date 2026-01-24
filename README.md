# שבצ״ק - Shavtzak Scheduling System

<div align="center">

**Military Unit Scheduling & Assignment Management System**

A full-stack monorepo featuring automated shift scheduling with constraint-aware algorithms

[Quick Start](#quick-start) • [Architecture](#architecture) • [Features](#features) • [Development](#development) • [Deployment](#deployment)

</div>

---

## Overview

Shavtzak (שבצ״ק - Scheduling) is a comprehensive military unit scheduling system that automates soldier assignments to shifts and tasks. The system consists of a React frontend with a NestJS backend, providing an intuitive Hebrew interface for managing personnel, defining tasks, and generating fair, constraint-aware schedules.

### Key Capabilities

- 📋 **Smart Auto-Scheduling**: Algorithm considering constraints, rest periods, and workload fairness
- 👥 **Personnel Management**: Complete soldier lifecycle with roles, ranks, and vacation tracking
- 📅 **Constraint System**: Manage availability (vacation, medical leave, unavailable dates)
- 🔄 **Real-time Sync**: React Query for optimistic updates and cache management
- 📊 **Fairness Analytics**: Visual distribution of assignments across personnel
- 🌐 **Full Persistence**: PostgreSQL database with TypeORM
- ✅ **End-to-End Testing**: Playwright test suite with 21 comprehensive scenarios

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 15+ (or use Docker Compose)
- **Git**

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd shavtzak-integration

# 2. Start PostgreSQL
docker-compose up -d

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Setup database
cd ../backend
npm run seed  # Creates schema and seeds 70 soldiers, 3 tasks

# 5. Start backend (Terminal 1)
npm run start:dev  # Runs on http://localhost:3000

# 6. Start frontend (Terminal 2)
cd ../frontend
npm run dev  # Runs on http://localhost:5173
```

### Option 2: Local PostgreSQL

```bash
# 1. Create database
createdb shabtzaq

# 2. Configure environment
cd backend
cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=shabtzaq
EOF

# 3. Continue with steps 3-6 above
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **API Documentation**: http://localhost:3000/api/docs (Swagger)

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         React + TypeScript Frontend                 │    │
│  │  - shadcn/ui components (Hebrew RTL)                │    │
│  │  - React Query for server state                     │    │
│  │  - Zustand for UI state                             │    │
│  │  - date-fns for scheduling logic                    │    │
│  └───────────────┬────────────────────────────────────┘    │
└────────────────┼─────────────────────────────────────────┘
                 │ REST API (JSON)
                 │ http://localhost:3000/api
┌────────────────▼─────────────────────────────────────────┐
│              NestJS Backend Server                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controllers (REST endpoints)                       │  │
│  │    /soldiers  /tasks  /assignments  /settings       │  │
│  └───────────────┬────────────────────────────────────┘  │
│  ┌───────────────▼────────────────────────────────────┐  │
│  │  Services (Business Logic)                          │  │
│  │   - Auto-scheduling algorithm                       │  │
│  │   - Constraint validation                           │  │
│  │   - Fairness distribution                           │  │
│  └───────────────┬────────────────────────────────────┘  │
│  ┌───────────────▼────────────────────────────────────┐  │
│  │  TypeORM Repositories                               │  │
│  └───────────────┬────────────────────────────────────┘  │
└────────────────┼─────────────────────────────────────────┘
                 │ SQL Queries
┌────────────────▼─────────────────────────────────────────┐
│              PostgreSQL Database                          │
│                                                            │
│  Tables: soldiers, tasks, assignments,                    │
│          constraints, settings                            │
└────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend (`/frontend`)
- **React** 18 - UI library with hooks
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Query** (@tanstack/react-query) - Server state management
- **Zustand** - Client state management
- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date manipulation
- **Playwright** - E2E testing

#### Backend (`/backend`)
- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type safety
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** 15 - Relational database
- **class-validator** - DTO validation
- **Swagger/OpenAPI** - API documentation

#### Infrastructure
- **Docker Compose** - PostgreSQL container
- **GitHub Actions** - CI/CD (future)
- **pnpm/npm** - Package management

---

## Features

### 1. Soldier Management
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Multiple roles per soldier (Commander, Driver, Radio Operator, Soldier)
- ✅ Rank and personal information
- ✅ Vacation tracking (used/maximum days)
- ✅ Constraint management:
  - Unavailable dates
  - Vacation periods
  - Medical leave
  - Custom reasons

### 2. Task Management
- ✅ Define shift-based tasks with start times and durations
- ✅ Required roles per task (e.g., "2 soldiers, 1 radio operator")
- ✅ Active/inactive task toggling
- ✅ Rest period requirements between shifts (e.g., 48 hours between guard duties)

### 3. Intelligent Auto-Scheduling
The system includes a sophisticated scheduling algorithm that:
- ✅ **Respects constraints**: Never assigns soldiers during unavailable periods
- ✅ **Enforces rest periods**: Ensures minimum rest time between shifts
- ✅ **Distributes workload fairly**: Uses histogram analysis to balance assignments
- ✅ **Considers roles**: Matches required roles with soldier capabilities
- ✅ **Maintains base presence**: Ensures minimum number of soldiers on base

**Algorithm Approach:**
1. Fetch all tasks, soldiers, existing assignments, and constraints
2. Filter available soldiers per task (exclude constrained, resting, or already assigned)
3. Sort soldiers by assignment count (fairness)
4. Assign required roles while respecting constraints
5. Update assignment counts and verify minimum base presence

### 4. Schedule Visualization
- ✅ Weekly calendar view with date navigation
- ✅ Task rows with soldier assignments
- ✅ Drag-and-drop assignment management (future enhancement)
- ✅ Color-coded by task type
- ✅ Today indicator and week navigation

### 5. Settings & Configuration
- ✅ Total soldiers in unit
- ✅ Minimum base presence requirement
- ✅ Default rest periods
- ✅ Persistent configuration storage

### 6. Data Persistence
- ✅ PostgreSQL database with full ACID compliance
- ✅ Automatic migrations via TypeORM
- ✅ Seed script with 70 sample soldiers and 3 tasks (morning, evening, guard shifts)
- ✅ Referential integrity with foreign keys

---

## Project Structure

```
shavtzak-integration/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # React components (soldiers, tasks, schedule)
│   │   ├── hooks/              # React Query hooks (useSoldiers, useTasks, etc.)
│   │   ├── lib/                # Utilities (API client, date helpers)
│   │   ├── store/              # Zustand stores (UI state)
│   │   ├── types/              # TypeScript types
│   │   └── App.tsx             # Main application component
│   ├── tests/
│   │   └── e2e/                # Playwright E2E tests
│   ├── public/                 # Static assets (logo, favicon)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md               # Frontend-specific documentation
│
├── backend/                     # NestJS backend application
│   ├── src/
│   │   ├── soldiers/           # Soldier module (entity, service, controller)
│   │   ├── tasks/              # Task module
│   │   ├── assignments/        # Assignment module + scheduling algorithm
│   │   ├── constraints/        # Constraint module
│   │   ├── settings/           # Settings module
│   │   ├── database/           # Database config and seeds
│   │   └── main.ts             # Application entry point
│   ├── test/                   # Backend tests
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md               # Backend-specific documentation
│
├── docs/
│   └── plans/                  # Design and implementation plans
│       ├── 2026-01-23-backend-implementation.md
│       ├── 2026-01-23-backend-redesign.md
│       ├── 2026-01-23-frontend-backend-integration-design.md
│       └── 2026-01-23-frontend-backend-integration-implementation.md
│
├── docker-compose.yml          # PostgreSQL container setup
└── README.md                   # This file
```

---

## Development

### Component Documentation

- **Frontend**: See [frontend/README.md](./frontend/README.md) for detailed component architecture, React Query setup, and E2E testing
- **Backend**: See [backend/README.md](./backend/README.md) for API endpoints, entity relationships, and scheduling algorithm details

### Database Management

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# Reset database (WARNING: destroys all data)
docker-compose down -v
docker-compose up -d
cd backend && npm run seed
```

### Running Tests

#### Backend Tests
```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

#### Frontend Tests
```bash
cd frontend
npm run test:e2e      # Run Playwright tests (requires backend + DB running)
npm run test:e2e:ui   # Open Playwright UI
npm run test:e2e:debug # Debug mode
```

**E2E Test Coverage:**
- ✅ Soldier CRUD operations (7 tests)
- ✅ Task management (4 tests)
- ✅ Schedule navigation and auto-scheduling (4 tests)
- ✅ Settings persistence (3 tests)
- ✅ Error handling and recovery (3 tests)

### Development Workflow

1. **Start Database**: `docker-compose up -d`
2. **Start Backend**: `cd backend && npm run start:dev`
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Make Changes**: Edit code in `frontend/src` or `backend/src`
5. **Test Changes**: Run E2E tests or manual testing
6. **Commit**: Follow conventional commit format (feat:, fix:, docs:, etc.)

### API Development

- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health
- **API Base URL**: http://localhost:3000/api

See [frontend/README.md](./frontend/README.md) for complete API documentation with examples.

---

## Deployment

### Production Build

#### Frontend
```bash
cd frontend
npm run build         # Creates dist/ folder
npm run preview       # Preview production build locally
```

#### Backend
```bash
cd backend
npm run build         # Creates dist/ folder
npm run start:prod    # Run production server
```

### Environment Variables

#### Backend `.env`
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=shabtzaq

# Server
PORT=3000
NODE_ENV=production

# CORS (set to your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend `.env`
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### Deployment Options

#### Option 1: Docker
```bash
# Build backend image
cd backend
docker build -t shabtzaq-backend .

# Build frontend image
cd frontend
docker build -t shabtzaq-frontend .

# Run with docker-compose (production)
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Cloud Platforms

**Backend (NestJS):**
- Heroku
- Railway
- Render
- AWS Elastic Beanstalk
- DigitalOcean App Platform

**Frontend (React):**
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages (with BrowserRouter → HashRouter change)

**Database:**
- AWS RDS (PostgreSQL)
- Heroku Postgres
- Supabase
- Railway Postgres
- DigitalOcean Managed Database

---

## Git Workflow

### Branches
- `main` - Production-ready code
- `integration/*` - Integration branches for major features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Convention
We follow conventional commits:
```
feat: add soldier constraint management
fix: resolve React hooks violation in ScheduleView
docs: update API documentation
test: add E2E tests for error handling
refactor: improve scheduling algorithm efficiency
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running: `docker-compose up -d`

**2. Port Already in Use**
```
Error: Port 3000 is already in use
```
**Solution**: Kill existing process: `lsof -ti:3000 | xargs kill -9`

**3. Frontend Can't Connect to Backend**
```
Network Error / CORS Error
```
**Solution**:
- Verify backend is running: `curl http://localhost:3000/health`
- Check CORS settings in `backend/src/main.ts`
- Verify VITE_API_URL in frontend

**4. E2E Tests Failing**
```
TimeoutError: Waiting for selector...
```
**Solution**:
- Ensure backend and database are running
- Seed database: `cd backend && npm run seed`
- Increase timeout in test: `{ timeout: 10000 }`

**5. React Hooks Error**
```
Error: Rendered more hooks than during the previous render
```
**Solution**: Ensure all hooks are called before any conditional returns

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

For questions or issues:
- Open a GitHub Issue
- Check existing documentation in `/docs/plans`
- Review component-specific READMEs in `/frontend` and `/backend`

---

<div align="center">

**Built with ❤️ using React, NestJS, and PostgreSQL**

[Back to Top](#שבצק---shavtzak-scheduling-system)

</div>
