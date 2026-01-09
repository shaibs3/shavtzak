# Shabtzaq - Smart Military Deployment Scheduler

**Design Document**
**Date:** January 9, 2026
**Status:** Approved for MVP Development

## Project Overview

Shabtzaq is a smart scheduling system to manage soldier shifts and vacations during military operational deployments. The system ensures operational readiness by enforcing constraints around base presence, rest periods, and personnel qualifications while giving commanders flexible control over scheduling.

## Goals & Requirements

### Core Objectives
- Maintain minimum 75% base presence at all times
- Track soldier vacation quotas and leave dates
- Assign qualified personnel to role-specific tasks
- Enforce mandatory rest periods between shifts
- Provide real-time constraint validation and warnings
- Support both commander control and soldier visibility

### Target Scale
- Medium units: 20-50 soldiers
- Variable deployment durations (weeks to months)
- Multiple concurrent task types with different personnel requirements

### User Roles
- **Commanders:** Full access - create schedules, manage soldiers, enter leave, approve assignments
- **Soldiers:** Read-only access - view personal schedule and leave balance

## Architecture

### System Architecture

**Three-Tier Design:**

1. **Frontend Layer**
   - Web application: React + TypeScript
   - Mobile apps (post-MVP): React Native + TypeScript
   - Shared business logic library for validation rules
   - State management: Redux Toolkit
   - Real-time updates: Polling (MVP) → WebSockets (post-MVP)

2. **Backend Layer**
   - Framework: NestJS (Node.js + TypeScript)
   - RESTful API for all operations
   - JWT-based authentication and authorization
   - Constraint validation engine
   - Schedule suggestion service (post-MVP)

3. **Data Layer**
   - Primary database: PostgreSQL
   - Caching (post-MVP): Redis
   - Automated backups and disaster recovery

### Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend Web | React + TypeScript | Modern, type-safe, large ecosystem |
| Frontend Mobile | React Native | Code sharing with web (post-MVP) |
| Backend | NestJS | Enterprise structure, TypeScript, DI |
| Database | PostgreSQL | Robust constraints, complex queries |
| Hosting - Backend | Render.com | Free tier for MVP |
| Hosting - Frontend | Vercel/Netlify | Free tier, automatic CDN |
| Authentication | JWT | Stateless, scalable |

## Data Model

### Core Entities

#### Soldier
```
id: uuid
name: string
rank: string
is_commander: boolean
is_driver: boolean
is_specialist: boolean
vacation_quota_days: integer
vacation_days_used: integer
created_at: timestamp
updated_at: timestamp
```

#### Task
```
id: uuid
name: string
type: string (Patrol, Guard Duty, Operations Room, etc.)
commanders_needed: integer
drivers_needed: integer
specialists_needed: integer
general_soldiers_needed: integer
shift_duration_hours: integer
is_active: boolean
```

#### Shift
```
id: uuid
task_id: uuid (foreign key)
start_time: timestamp
end_time: timestamp
status: enum (scheduled, in_progress, completed)
approved_by: uuid (foreign key to soldiers)
created_at: timestamp
updated_at: timestamp
```

#### ShiftAssignment
```
id: uuid
shift_id: uuid (foreign key)
soldier_id: uuid (foreign key)
role: enum (commander, driver, specialist, general)
assigned_at: timestamp
```

#### LeaveRecord
```
id: uuid
soldier_id: uuid (foreign key)
start_date: date
end_date: date
reason: text
entered_by: uuid (foreign key to soldiers)
created_at: timestamp
```

#### Deployment
```
id: uuid
name: string
start_date: date
end_date: date
total_manpower: integer
minimum_presence_percentage: integer (default: 75)
minimum_rest_hours: integer
is_active: boolean
```

#### User
```
id: uuid
soldier_id: uuid (foreign key, nullable)
username: string (unique)
password_hash: string
role: enum (commander, soldier)
```

## Scheduling Logic

### Constraint System

#### Hard Constraints (Must Never Violate)
1. **Minimum Presence:** At least 75% of total manpower must be on base at all times
2. **Qualification Matching:** Only assign soldiers with correct qualifications to specific roles
3. **Rest Periods:** Ensure minimum rest hours elapsed since soldier's last shift end
4. **No Overlaps:** Soldier cannot be assigned to multiple shifts simultaneously
5. **Vacation Quota:** Soldier's vacation days used cannot exceed their quota

#### Soft Constraints (Optimize For - Post-MVP)
1. **Fair Distribution:** Balance total shift hours across all soldiers
2. **Spread Rest Days:** Give soldiers consecutive days off when possible
3. **Team Continuity:** Keep same personnel together for recurring tasks

### Scheduling Workflow

**MVP Approach (Manual with Validation):**
1. Commander creates shift for specific time slot and task
2. Commander assigns soldiers to required roles (commander, driver, specialist, general)
3. System validates assignment in real-time:
   - Check soldier qualifications match role
   - Verify soldier not on leave during shift time
   - Calculate if soldier has sufficient rest since last shift
   - Verify no scheduling conflicts
   - Calculate remaining base presence after assignment
4. Display blocking errors or warnings to commander
5. Commander acknowledges/fixes issues before saving
6. Shift saved to database with approval metadata

**Post-MVP (Semi-Automatic):**
- Commander requests schedule generation for date range
- System suggests optimal assignments using constraint solver
- Commander reviews, modifies, and approves suggested schedule

### Validation Levels

**Blocking Errors (Red):**
- Cannot save shift
- Examples: Unqualified soldier in role, insufficient rest period, drops below 75% presence

**Warnings (Yellow):**
- Can save with acknowledgment
- Examples: Uneven workload distribution, approaching vacation quota, no qualified personnel available

**Info Notices (Blue):**
- Helpful suggestions
- Examples: Schedule optimized, recurring patterns detected

## User Interface

### Commander Dashboard

**Main Components:**
1. **Schedule Calendar**
   - Week/month view with color-coded shift blocks
   - Click shift to view/edit assignments
   - Task type determines color (Patrol=blue, Guard=green, Operations=orange)

2. **Constraint Status Panel**
   - Current base presence: "38/50 soldiers (76%)" with color indicator
   - Vacation days tracker across unit
   - Warning count with severity levels

3. **Quick Actions**
   - Generate Schedule (post-MVP)
   - Add Leave
   - Create Task
   - View Reports

4. **Alert/Warning Center**
   - Expandable panel with violation details
   - Each warning shows: title, description, timestamp, "View Details" link
   - Dismiss option with audit trail

### Schedule Management Screens

**Shift Creation/Edit:**
- Task selection dropdown
- Date/time pickers for start time (end time auto-calculated from task duration)
- Role assignment sections:
  - Commander slot(s): dropdown filtered to qualified soldiers
  - Driver slot(s): dropdown filtered to qualified drivers
  - Specialist slot(s): dropdown filtered to qualified specialists
  - General soldier slots: dropdown of remaining qualified soldiers
- Real-time validation feedback
- Save/Cancel buttons

**Task Management:**
- List view of all tasks with edit/delete
- Create task form: name, type, personnel requirements, shift duration
- Preview of shift generation pattern

**Leave Management:**
- Calendar view for date selection
- Soldier selection dropdown
- Reason text field
- Validation preview showing impact on presence percentage

### Soldier View

**Personal Dashboard:**
- Personal schedule calendar showing assigned shifts
- Leave balance display: "12 days used / 20 days available"
- Next shift countdown
- Shift history log

## API Design

### Authentication Endpoints
```
POST   /api/auth/login          { username, password } → { token, user }
POST   /api/auth/logout         Invalidate token
GET    /api/auth/me             Get current user info
```

### Soldier Endpoints
```
GET    /api/soldiers            List all soldiers
POST   /api/soldiers            Create soldier
GET    /api/soldiers/:id        Get soldier details
PUT    /api/soldiers/:id        Update soldier
DELETE /api/soldiers/:id        Delete soldier
```

### Task Endpoints
```
GET    /api/tasks               List all active tasks
POST   /api/tasks               Create task
PUT    /api/tasks/:id           Update task
DELETE /api/tasks/:id           Delete task
```

### Shift Endpoints
```
GET    /api/shifts?start_date=&end_date=    Get shifts in date range
POST   /api/shifts                          Create shift
PUT    /api/shifts/:id                      Update shift
DELETE /api/shifts/:id                      Delete shift
POST   /api/shifts/:id/assign               Assign soldier to shift
DELETE /api/shifts/:id/assignments/:id      Remove assignment
```

### Leave Endpoints
```
GET    /api/leave               List all leave records
POST   /api/leave               Create leave record
DELETE /api/leave/:id           Delete leave record
```

### Deployment Endpoints
```
GET    /api/deployment          Get active deployment config
PUT    /api/deployment          Update deployment config
```

### Validation/Dashboard Endpoints
```
POST   /api/validate/shift      Validate shift before saving
GET    /api/dashboard/status    Get current presence %, warnings, stats
```

## MVP Scope

### Phase 1 - MVP (Weeks 1-4)

**Must Have:**
- User authentication with role-based access (commander/soldier)
- Soldier CRUD with basic info and qualifications
- Task CRUD with personnel requirements
- Leave management with 75% presence validation
- Manual shift creation with real-time constraint validation
- All hard constraints enforced
- Dashboard with calendar view and warning panel
- Soldier personal schedule view
- Web application only (desktop-first)

**Explicitly Excluded from MVP:**
- Automated schedule generation/optimization
- Mobile applications
- Email/SMS notifications
- WebSocket real-time updates (use polling)
- Redis caching
- Drag-and-drop interface
- Advanced reporting/analytics
- Shift recurrence patterns
- Multi-deployment support
- PDF/Excel export
- Responsive mobile design

**MVP Success Criteria:**
A commander can:
1. Define a 2-week deployment with 30 soldiers
2. Create 5 task types with different requirements
3. Enter leave for 5 soldiers
4. Manually build a week's schedule with 20 shifts
5. System prevents all constraint violations
6. Dashboard displays presence status and warnings
7. Soldier can log in and view their personal schedule

### Post-MVP Enhancements

**Phase 2 (Months 2-3):**
- Automated schedule generation with optimization
- Drag-and-drop schedule editing
- WebSocket real-time updates
- Mobile apps (React Native)
- Enhanced reporting and analytics
- Shift recurrence patterns

**Phase 3 (Months 4+):**
- Email/SMS notifications
- Advanced optimization (multi-objective)
- Historical data analysis
- Performance insights
- Multi-deployment management
- Integration with existing military systems

## Testing Strategy

### Backend Testing

**Unit Tests (Jest):**
- Constraint validation functions (each constraint independently)
- Business logic services
- Target: 80% code coverage

**Integration Tests (Jest + Supertest):**
- API endpoint request/response cycles
- Database operations and transactions
- Authorization rules
- Target: Cover all critical workflows

### Frontend Testing

**Component Tests (React Testing Library):**
- Component rendering with various props
- User interaction handlers
- Constraint warning displays
- Focus on: ShiftEditModal, PresenceIndicator, WarningPanel

**E2E Tests (Post-MVP - Cypress):**
- Complete user journeys
- Run against staging before deployment

### Manual Testing

**MVP Test Script:**
1. Create 30 soldiers with various qualifications
2. Create 5 task types
3. Enter leave for multiple soldiers
4. Build a week's schedule
5. Verify all constraint violations caught
6. Test both commander and soldier accounts

## Deployment

### Infrastructure

**Development:**
- Local: Docker Compose for PostgreSQL
- Environment: `.env` files for local/staging/production
- Hot reload: React dev server + NestJS watch mode

**Hosting:**
- Backend: Render.com free tier
- Database: Render.com managed PostgreSQL (500MB)
- Frontend: Vercel or Netlify free tier
- Cost: $0/month for MVP

**Environments:**
- Development: Local machines
- Staging: Render.com + Vercel
- Production: Same infrastructure (separate instances)

### CI/CD

**Pipeline:**
- Repository: GitHub/GitLab
- Automated tests on pull requests
- Auto-deploy to staging on merge to `main`
- Manual promotion to production

**Backup & Recovery:**
- Database: Daily automated backups (30-day retention)
- Recovery time objective: 1 hour
- Managed by hosting provider

### Monitoring (Post-MVP)

- Application logs: Centralized logging service
- Error tracking: Sentry
- Uptime monitoring: Simple ping service

## Security Considerations

### Authentication & Authorization
- Password hashing: bcrypt
- JWT tokens with expiration
- Role-based access control on all endpoints
- Secure password requirements

### Data Protection
- HTTPS only (enforced)
- Environment variables for secrets
- SQL injection prevention (ORM parameterized queries)
- Input validation on all API endpoints

### Audit Trail
- Log all schedule modifications
- Track who created/modified/deleted records
- Timestamp all operations

## Implementation Timeline

### Week 1: Foundation
- Set up project structure (NestJS + React)
- Database schema implementation
- Authentication system
- Basic CRUD for soldiers and tasks

### Week 2: Core Scheduling
- Shift creation and assignment
- Constraint validation engine
- Leave management
- Dashboard presence indicator

### Week 3: UI & Validation
- Schedule calendar view
- Warning panel and alerts
- Soldier personal view
- Real-time validation feedback

### Week 4: Testing & Deployment
- Unit and integration tests
- Manual testing with realistic data
- Deploy to staging
- User acceptance testing
- Deploy to production

## Future Considerations

### Scalability
- Current design handles 20-50 soldiers efficiently
- For 100+ soldiers: Add Redis caching, optimize queries, consider background job processing

### Extensibility
- Plugin system for custom task types
- API for external system integration
- Webhook notifications for third-party tools

### Internationalization
- Support Hebrew interface (important for IDF context)
- Date/time localization
- Multi-language support

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Constraint logic bugs | High | Comprehensive unit tests, manual validation |
| Performance with large datasets | Medium | Optimize queries, add caching post-MVP |
| User adoption | Medium | Simple UI, training materials |
| Hosting limitations | Low | Render.com sufficient for MVP, easy migration |
| Mobile not in MVP | Low | Web-first is acceptable, mobile in Phase 2 |

## Success Metrics

**MVP Success Indicators:**
1. Commander can create complete 2-week schedule in < 30 minutes
2. Zero constraint violations slip through validation
3. Soldiers can view schedule without confusion
4. System handles 30 soldiers, 20 shifts/week without performance issues
5. Deployment completed in 4 weeks

**Long-term Metrics (Post-MVP):**
- Time to create schedule reduced by 60% (with automation)
- User satisfaction score > 4/5
- System uptime > 99%
- Active usage by multiple units

## Conclusion

Shabtzaq provides a robust, constraint-based scheduling system that balances operational requirements with soldier welfare. The MVP focuses on manual scheduling with strong validation, laying the foundation for automated optimization in future phases. The chosen technology stack enables rapid development, code sharing, and easy scaling as requirements grow.

The system prioritizes:
- **Safety:** Hard constraints prevent operational gaps
- **Flexibility:** Commanders retain full control
- **Visibility:** Real-time feedback and clear warnings
- **Simplicity:** Clean UX focused on essential features

Next step: Begin implementation with Week 1 foundation tasks.