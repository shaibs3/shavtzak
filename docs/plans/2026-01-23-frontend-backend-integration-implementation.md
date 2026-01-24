# Frontend-Backend Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect React frontend with NestJS backend using React Query, replacing Zustand store with server-driven state management.

**Architecture:** Replace client-side Zustand store with React Query hooks that fetch from NestJS REST API. Create service layer for API calls, React Query hooks for data fetching/mutations, and update all components to use new hooks.

**Tech Stack:** React Query, Axios, TypeScript, NestJS REST API, shadcn/ui

---

## Phase 1: Backend Verification (Tasks 1-2)

Backend entities are already updated correctly. Verify they work properly.

### Task 1: Test Backend Constraint Endpoints

**Objective:** Verify Constraint entity with startDate/endDate works correctly

**Files:**
- Read: `backend/src/soldiers/entities/constraint.entity.ts`
- Test: Manual API testing via Swagger

**Step 1: Start backend server**

```bash
cd backend
npm run start:dev
```

Expected: Server starts on http://localhost:3000

**Step 2: Open Swagger documentation**

Open: http://localhost:3000/api/docs

Expected: Swagger UI loads with all endpoints

**Step 3: Test creating a soldier with constraint**

Use POST /api/soldiers endpoint with:
```json
{
  "name": "Test Soldier",
  "rank": "טוראי",
  "roles": ["soldier"],
  "maxVacationDays": 5,
  "usedVacationDays": 0
}
```

Expected: Soldier created with UUID

**Step 4: Test adding constraint**

Use POST /api/soldiers/{id}/constraints with:
```json
{
  "type": "vacation",
  "startDate": "2026-01-25",
  "endDate": "2026-01-27",
  "reason": "בדיקה"
}
```

Expected: Constraint added with startDate and endDate

**Step 5: Verify constraint in GET /api/soldiers**

Expected: Soldier returned with constraints array containing startDate/endDate fields

---

### Task 2: Test Backend Assignment Endpoints

**Objective:** Verify Assignment entity with role/startTime/endTime/locked works correctly

**Files:**
- Read: `backend/src/assignments/entities/assignment.entity.ts`
- Test: Manual API testing via Swagger

**Step 1: Get soldier and task IDs**

GET /api/soldiers - note first soldier ID
GET /api/tasks - note first task ID

**Step 2: Create assignment**

Use POST /api/assignments with:
```json
{
  "taskId": "<task-id-from-step-1>",
  "soldierId": "<soldier-id-from-step-1>",
  "role": "soldier",
  "startTime": "2026-01-25T08:00:00Z",
  "endTime": "2026-01-25T16:00:00Z",
  "locked": false
}
```

Expected: Assignment created with all fields

**Step 3: Verify assignment**

GET /api/assignments

Expected: Assignment returned with role, startTime, endTime, locked fields

**Step 4: Document backend is ready**

Backend entities are confirmed working. Ready for frontend integration.

---

## Phase 2: Frontend API Layer (Tasks 3-9)

### Task 3: Install axios

**Objective:** Add axios for HTTP requests

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install axios**

```bash
cd frontend
npm install axios
```

Expected: axios added to dependencies

**Step 2: Verify installation**

```bash
npm list axios
```

Expected: Shows axios version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add axios for API requests"
```

---

### Task 4: Create Environment Configuration

**Objective:** Set up environment variables for API base URL

**Files:**
- Create: `frontend/.env`
- Create: `frontend/.env.example`

**Step 1: Create .env file**

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Step 2: Create .env.example file**

```bash
# frontend/.env.example
VITE_API_BASE_URL=http://localhost:3000/api
```

**Step 3: Verify .env is in .gitignore**

Check `frontend/.gitignore` contains:
```
.env
```

**Step 4: Commit**

```bash
git add .env.example
git commit -m "feat: add environment configuration for API base URL"
```

---

### Task 5: Create API Client

**Objective:** Set up Axios client with interceptors

**Files:**
- Create: `frontend/src/services/api.ts`

**Step 1: Create API client file**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'אירעה שגיאה';
    toast({
      variant: 'destructive',
      title: 'שגיאה',
      description: Array.isArray(message) ? message.join(', ') : message,
    });
    return Promise.reject(error);
  }
);
```

**Step 2: Test API client compiles**

```bash
npm run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat: create API client with error interceptor"
```

---

### Task 6: Update Frontend Types

**Objective:** Align frontend types with backend entities

**Files:**
- Modify: `frontend/src/types/scheduling.ts`

**Step 1: Update Constraint interface**

Current Constraint already has startDate/endDate, so it's correct. Verify:

```typescript
export interface Constraint {
  id: string;
  type: 'unavailable' | 'vacation' | 'medical' | 'other';
  startDate: Date;
  endDate: Date;
  reason?: string;
}
```

**Step 2: Update Assignment interface**

Current Assignment already has role/startTime/endTime/locked, so it's correct. Verify:

```typescript
export interface Assignment {
  id: string;
  taskId: string;
  soldierId: string;
  role: Role;
  startTime: Date;
  endTime: Date;
  locked: boolean;
}
```

**Step 3: Add DTO types**

Add at end of file:

```typescript
// DTOs for API requests
export type CreateSoldierDto = Omit<Soldier, 'id' | 'constraints'>;
export type UpdateSoldierDto = Partial<CreateSoldierDto>;

export type CreateConstraintDto = Omit<Constraint, 'id'>;

export type CreateTaskDto = Omit<Task, 'id'>;
export type UpdateTaskDto = Partial<CreateTaskDto>;

export type CreateAssignmentDto = Omit<Assignment, 'id'>;
export type UpdateAssignmentDto = Partial<CreateAssignmentDto>;

export type UpdateSettingsDto = Partial<ScheduleSettings>;
```

**Step 4: Commit**

```bash
git add src/types/scheduling.ts
git commit -m "feat: add DTO types for API requests"
```

---

### Task 7: Create Soldiers Service

**Objective:** Create API service for soldiers and constraints

**Files:**
- Create: `frontend/src/services/soldiers.service.ts`

**Step 1: Create soldiers service**

```typescript
// frontend/src/services/soldiers.service.ts
import { apiClient } from './api';
import type { Soldier, CreateSoldierDto, UpdateSoldierDto, CreateConstraintDto } from '@/types/scheduling';

export const soldiersService = {
  getAll: () => apiClient.get<Soldier[]>('/soldiers'),

  getById: (id: string) => apiClient.get<Soldier>(`/soldiers/${id}`),

  create: (data: CreateSoldierDto) => apiClient.post<Soldier>('/soldiers', data),

  update: (id: string, data: UpdateSoldierDto) =>
    apiClient.patch<Soldier>(`/soldiers/${id}`, data),

  remove: (id: string) => apiClient.delete(`/soldiers/${id}`),

  addConstraint: (soldierId: string, data: CreateConstraintDto) =>
    apiClient.post<Soldier>(`/soldiers/${soldierId}/constraints`, data),

  removeConstraint: (soldierId: string, constraintId: string) =>
    apiClient.delete(`/soldiers/${soldierId}/constraints/${constraintId}`),
};
```

**Step 2: Verify it compiles**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/services/soldiers.service.ts
git commit -m "feat: create soldiers API service"
```

---

### Task 8: Create Tasks, Assignments, Settings Services

**Objective:** Create remaining API services

**Files:**
- Create: `frontend/src/services/tasks.service.ts`
- Create: `frontend/src/services/assignments.service.ts`
- Create: `frontend/src/services/settings.service.ts`

**Step 1: Create tasks service**

```typescript
// frontend/src/services/tasks.service.ts
import { apiClient } from './api';
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types/scheduling';

export const tasksService = {
  getAll: () => apiClient.get<Task[]>('/tasks'),

  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),

  create: (data: CreateTaskDto) => apiClient.post<Task>('/tasks', data),

  update: (id: string, data: UpdateTaskDto) =>
    apiClient.patch<Task>(`/tasks/${id}`, data),

  remove: (id: string) => apiClient.delete(`/tasks/${id}`),
};
```

**Step 2: Create assignments service**

```typescript
// frontend/src/services/assignments.service.ts
import { apiClient } from './api';
import type { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '@/types/scheduling';

export const assignmentsService = {
  getAll: () => apiClient.get<Assignment[]>('/assignments'),

  getById: (id: string) => apiClient.get<Assignment>(`/assignments/${id}`),

  create: (data: CreateAssignmentDto) => apiClient.post<Assignment>('/assignments', data),

  update: (id: string, data: UpdateAssignmentDto) =>
    apiClient.patch<Assignment>(`/assignments/${id}`, data),

  remove: (id: string) => apiClient.delete(`/assignments/${id}`),
};
```

**Step 3: Create settings service**

```typescript
// frontend/src/services/settings.service.ts
import { apiClient } from './api';
import type { ScheduleSettings, UpdateSettingsDto } from '@/types/scheduling';

export const settingsService = {
  get: () => apiClient.get<ScheduleSettings>('/settings'),

  update: (data: UpdateSettingsDto) =>
    apiClient.patch<ScheduleSettings>('/settings', data),
};
```

**Step 4: Verify all compile**

```bash
npm run build
```

Expected: No errors

**Step 5: Commit**

```bash
git add src/services/tasks.service.ts src/services/assignments.service.ts src/services/settings.service.ts
git commit -m "feat: create tasks, assignments, and settings API services"
```

---

### Task 9: Create React Query Hooks - Soldiers

**Objective:** Create React Query hooks for soldiers

**Files:**
- Create: `frontend/src/hooks/useSoldiers.ts`

**Step 1: Create soldiers hooks file**

```typescript
// frontend/src/hooks/useSoldiers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { soldiersService } from '@/services/soldiers.service';
import { toast } from '@/components/ui/use-toast';
import type { CreateSoldierDto, UpdateSoldierDto, CreateConstraintDto } from '@/types/scheduling';

export const useSoldiers = () => {
  return useQuery({
    queryKey: ['soldiers'],
    queryFn: async () => {
      const response = await soldiersService.getAll();
      return response.data;
    },
  });
};

export const useCreateSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSoldierDto) => soldiersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל נוסף בהצלחה' });
    },
  });
};

export const useUpdateSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSoldierDto }) =>
      soldiersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל עודכן בהצלחה' });
    },
  });
};

export const useDeleteSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => soldiersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל נמחק בהצלחה' });
    },
  });
};

export const useAddConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ soldierId, data }: { soldierId: string; data: CreateConstraintDto }) =>
      soldiersService.addConstraint(soldierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'המגבלה נוספה בהצלחה' });
    },
  });
};

export const useRemoveConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ soldierId, constraintId }: { soldierId: string; constraintId: string }) =>
      soldiersService.removeConstraint(soldierId, constraintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'המגבלה הוסרה בהצלחה' });
    },
  });
};
```

**Step 2: Verify it compiles**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useSoldiers.ts
git commit -m "feat: create React Query hooks for soldiers"
```

---

## Phase 3: More React Query Hooks (Tasks 10-12)

### Task 10: Create React Query Hooks - Tasks

**Objective:** Create React Query hooks for tasks

**Files:**
- Create: `frontend/src/hooks/useTasks.ts`

**Step 1: Create tasks hooks file**

```typescript
// frontend/src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks.service';
import { toast } from '@/components/ui/use-toast';
import type { CreateTaskDto, UpdateTaskDto } from '@/types/scheduling';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await tasksService.getAll();
      return response.data;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'המשימה נוספה בהצלחה' });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'המשימה עודכנה בהצלחה' });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'המשימה נמחקה בהצלחה' });
    },
  });
};
```

**Step 2: Verify it compiles**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useTasks.ts
git commit -m "feat: create React Query hooks for tasks"
```

---

### Task 11: Create React Query Hooks - Assignments

**Objective:** Create React Query hooks for assignments

**Files:**
- Create: `frontend/src/hooks/useAssignments.ts`

**Step 1: Create assignments hooks file**

```typescript
// frontend/src/hooks/useAssignments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentsService } from '@/services/assignments.service';
import { toast } from '@/components/ui/use-toast';
import type { CreateAssignmentDto, UpdateAssignmentDto } from '@/types/scheduling';

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const response = await assignmentsService.getAll();
      return response.data;
    },
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssignmentDto) => assignmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ נוסף בהצלחה' });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssignmentDto }) =>
      assignmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ עודכן בהצלחה' });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => assignmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({ title: 'השיבוץ נמחק בהצלחה' });
    },
  });
};
```

**Step 2: Verify it compiles**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useAssignments.ts
git commit -m "feat: create React Query hooks for assignments"
```

---

### Task 12: Create React Query Hooks - Settings

**Objective:** Create React Query hooks for settings

**Files:**
- Create: `frontend/src/hooks/useSettings.ts`

**Step 1: Create settings hooks file**

```typescript
// frontend/src/hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settings.service';
import { toast } from '@/components/ui/use-toast';
import type { UpdateSettingsDto } from '@/types/scheduling';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsService.get();
      return response.data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSettingsDto) => settingsService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'ההגדרות עודכנו בהצלחה' });
    },
  });
};
```

**Step 2: Verify it compiles**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/useSettings.ts
git commit -m "feat: create React Query hooks for settings"
```

---

## Phase 4: Component Migration (Tasks 13-17)

### Task 13: Update Soldiers Component

**Objective:** Replace Zustand with React Query in SoldiersView

**Files:**
- Modify: `frontend/src/components/soldiers/SoldiersView.tsx`

**Step 1: Read current SoldiersView**

Read the file to understand current structure.

**Step 2: Replace store usage with hooks**

Replace:
```typescript
const { soldiers, addSoldier, updateSoldier, deleteSoldier } = useSchedulingStore();
```

With:
```typescript
import { useSoldiers, useCreateSoldier, useUpdateSoldier, useDeleteSoldier, useAddConstraint, useRemoveConstraint } from '@/hooks/useSoldiers';

const { data: soldiers, isLoading, error, refetch } = useSoldiers();
const createSoldier = useCreateSoldier();
const updateSoldier = useUpdateSoldier();
const deleteSoldier = useDeleteSoldier();
const addConstraint = useAddConstraint();
const removeConstraint = useRemoveConstraint();
```

**Step 3: Update handlers to use mutations**

Replace direct state updates with:
```typescript
const handleCreate = (data) => {
  createSoldier.mutate(data);
};

const handleUpdate = (id: string, data) => {
  updateSoldier.mutate({ id, data });
};

const handleDelete = (id: string) => {
  deleteSoldier.mutate(id);
};
```

**Step 4: Add loading and error states**

Add at top of component:
```typescript
if (isLoading) {
  return <div className="p-8 text-center">טוען...</div>;
}

if (error) {
  return (
    <div className="text-center p-8">
      <p className="text-destructive mb-4">שגיאה בטעינת החיילים</p>
      <Button onClick={() => refetch()}>נסה שוב</Button>
    </div>
  );
}
```

**Step 5: Handle undefined data**

Add:
```typescript
const soldiersList = soldiers ?? [];
```

Use `soldiersList` instead of `soldiers` throughout.

**Step 6: Test the component**

Start frontend:
```bash
npm run dev
```

Navigate to soldiers view, verify:
- List loads from backend
- Create works
- Update works
- Delete works
- Constraints work

**Step 7: Commit**

```bash
git add src/components/soldiers/SoldiersView.tsx
git commit -m "feat: migrate SoldiersView to React Query"
```

---

### Task 14: Update Tasks Component

**Objective:** Replace Zustand with React Query in TasksView

**Files:**
- Modify: `frontend/src/components/tasks/TasksView.tsx`

**Step 1: Read current TasksView**

Read the file to understand current structure.

**Step 2: Replace store usage with hooks**

Replace store imports with:
```typescript
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

const { data: tasks, isLoading, error, refetch } = useTasks();
const createTask = useCreateTask();
const updateTask = useUpdateTask();
const deleteTask = useDeleteTask();
```

**Step 3: Update handlers**

```typescript
const handleCreate = (data) => {
  createTask.mutate(data);
};

const handleUpdate = (id: string, data) => {
  updateTask.mutate({ id, data });
};

const handleDelete = (id: string) => {
  deleteTask.mutate(id);
};
```

**Step 4: Add loading and error states**

Same pattern as soldiers component.

**Step 5: Handle undefined data**

```typescript
const tasksList = tasks ?? [];
```

**Step 6: Test the component**

Verify tasks CRUD operations work.

**Step 7: Commit**

```bash
git add src/components/tasks/TasksView.tsx
git commit -m "feat: migrate TasksView to React Query"
```

---

### Task 15: Update Settings Component

**Objective:** Replace Zustand with React Query in SettingsView

**Files:**
- Modify: `frontend/src/components/settings/SettingsView.tsx`

**Step 1: Read current SettingsView**

Read the file to understand current structure.

**Step 2: Replace store usage with hooks**

```typescript
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

const { data: settings, isLoading, error, refetch } = useSettings();
const updateSettings = useUpdateSettings();
```

**Step 3: Update save handler**

```typescript
const handleSave = (data) => {
  updateSettings.mutate(data);
};
```

**Step 4: Add loading states**

Show loading while fetching or saving:
```typescript
if (isLoading) {
  return <div className="p-8 text-center">טוען...</div>;
}

// In save button
<Button
  onClick={handleSave}
  disabled={updateSettings.isLoading}
>
  {updateSettings.isLoading ? 'שומר...' : 'שמור'}
</Button>
```

**Step 5: Test the component**

Verify settings load and save correctly.

**Step 6: Commit**

```bash
git add src/components/settings/SettingsView.tsx
git commit -m "feat: migrate SettingsView to React Query"
```

---

### Task 16: Update Schedule Component

**Objective:** Replace Zustand with React Query in ScheduleView

**Files:**
- Modify: `frontend/src/components/schedule/ScheduleView.tsx`

**Step 1: Read current ScheduleView**

Read the file to understand current structure.

**Step 2: Replace store usage with multiple hooks**

```typescript
import { useAssignments, useCreateAssignment, useDeleteAssignment } from '@/hooks/useAssignments';
import { useSoldiers } from '@/hooks/useSoldiers';
import { useTasks } from '@/hooks/useTasks';

const { data: assignments, isLoading: assignmentsLoading } = useAssignments();
const { data: soldiers, isLoading: soldiersLoading } = useSoldiers();
const { data: tasks, isLoading: tasksLoading } = useTasks();
const createAssignment = useCreateAssignment();
const deleteAssignment = useDeleteAssignment();

const isLoading = assignmentsLoading || soldiersLoading || tasksLoading;
```

**Step 3: Combine data**

```typescript
const enrichedAssignments = (assignments ?? []).map(assignment => ({
  ...assignment,
  soldier: (soldiers ?? []).find(s => s.id === assignment.soldierId),
  task: (tasks ?? []).find(t => t.id === assignment.taskId),
}));
```

**Step 4: Update handlers**

```typescript
const handleCreateAssignment = (data) => {
  createAssignment.mutate(data);
};

const handleDeleteAssignment = (id: string) => {
  deleteAssignment.mutate(id);
};
```

**Step 5: Add loading states**

Show loading while any query is loading.

**Step 6: Test the component**

Verify schedule loads with combined data, assignments can be created/deleted.

**Step 7: Commit**

```bash
git add src/components/schedule/ScheduleView.tsx
git commit -m "feat: migrate ScheduleView to React Query"
```

---

### Task 17: Update Dashboard Component

**Objective:** Replace Zustand with React Query in Dashboard

**Files:**
- Modify: `frontend/src/components/dashboard/Dashboard.tsx`

**Step 1: Read current Dashboard**

Read the file to understand what data it needs.

**Step 2: Replace store usage**

Import only the hooks needed for dashboard stats/overview.

**Step 3: Update data access**

Replace store data with React Query hook data.

**Step 4: Test the component**

Verify dashboard displays correct stats.

**Step 5: Commit**

```bash
git add src/components/dashboard/Dashboard.tsx
git commit -m "feat: migrate Dashboard to React Query"
```

---

## Phase 5: Cleanup (Tasks 18-19)

### Task 18: Remove Zustand Store

**Objective:** Delete Zustand store file

**Files:**
- Delete: `frontend/src/store/schedulingStore.ts`

**Step 1: Verify no imports of schedulingStore**

Search for imports:
```bash
grep -r "schedulingStore" frontend/src/
```

Expected: No results (all replaced)

**Step 2: Delete the store file**

```bash
rm frontend/src/store/schedulingStore.ts
```

**Step 3: Remove zustand dependencies**

```bash
cd frontend
npm uninstall zustand
```

**Step 4: Verify app still compiles**

```bash
npm run build
```

Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Zustand store, fully migrated to React Query"
```

---

### Task 19: Final Testing and Documentation

**Objective:** Test entire integration end-to-end

**Files:**
- Modify: `README.md` (if needed)

**Step 1: Start both servers**

Terminal 1:
```bash
cd backend
npm run start:dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

**Step 2: Test all CRUD operations**

Test checklist:
- [ ] Create soldier
- [ ] Update soldier
- [ ] Delete soldier
- [ ] Add constraint to soldier
- [ ] Remove constraint from soldier
- [ ] Create task
- [ ] Update task
- [ ] Delete task
- [ ] View settings
- [ ] Update settings
- [ ] Create assignment
- [ ] Delete assignment
- [ ] Data persists across page refresh

**Step 3: Test error scenarios**

- [ ] Stop backend, verify error messages appear
- [ ] Start backend, verify data reloads
- [ ] Submit invalid data, verify validation errors

**Step 4: Check for console errors**

Open browser console, verify no errors during normal operation.

**Step 5: Document any issues found**

If issues found, fix them before proceeding.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: frontend-backend integration complete and tested"
```

**Step 7: Push to remote**

```bash
git push origin main
```

---

## Success Criteria

✅ All components use React Query instead of Zustand
✅ All CRUD operations work for soldiers, tasks, assignments, settings
✅ Constraints work (add/remove)
✅ Data loads from backend on page load
✅ Data persists across page refreshes
✅ Loading states show during data fetch
✅ Error messages appear for failed requests
✅ Hebrew text displays correctly
✅ No console errors during normal use
✅ Backend and frontend types are aligned
✅ No Zustand code remains in codebase

---

## Rollback Plan

If issues occur:
1. Check backend is running: http://localhost:3000/api/docs
2. Check .env file has correct API URL
3. Check browser network tab for failed requests
4. Check browser console for errors
5. Verify axios is installed: `npm list axios`
6. If all else fails, revert last commit: `git revert HEAD`
