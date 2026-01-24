# Frontend-Backend Integration Design

**Date:** 2026-01-23
**Goal:** Connect React frontend with NestJS backend, replacing Zustand with React Query for server state management

---

## Architecture Overview

### High-Level Flow
```
Backend (NestJS) → REST API → React Query Hooks → React Components
```

### Key Changes

**1. Backend Updates:**
- Update `Constraint` entity: change `date` field to `startDate` and `endDate` (date range)
- Update `Assignment` entity: remove `date`/`shift`/`status`, add `role`/`startTime`/`endTime`/`locked`
- Update corresponding DTOs and service methods
- Keep all existing validation rules

**2. Frontend Structure:**
- Remove Zustand store (`schedulingStore.ts`)
- Create `src/services/api.ts` - Axios client with base URL configuration
- Create `src/services/` folder with typed service modules:
  - `soldiers.service.ts` - API calls for soldiers & constraints
  - `tasks.service.ts` - API calls for tasks
  - `assignments.service.ts` - API calls for assignments
  - `settings.service.ts` - API calls for settings
- Create `src/hooks/` folder with React Query hooks:
  - `useSoldiers.ts`, `useTasks.ts`, `useAssignments.ts`, `useSettings.ts`
- Update all components to use React Query hooks instead of Zustand

**3. Type Alignment:**
- Update frontend types to match backend
- Use the same field names and structures

---

## API Service Layer & React Query Setup

### Environment Configuration

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000/api
```

### API Client Setup (`src/services/api.ts`)

**Axios Configuration:**
- Base URL from environment variable
- Request/response interceptors for error handling
- Automatic JSON parsing
- Toast notifications for errors
- Timeout configuration

**Example:**
```typescript
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
    toast({
      variant: 'destructive',
      title: 'שגיאה',
      description: error.response?.data?.message || 'אירעה שגיאה',
    });
    return Promise.reject(error);
  }
);
```

### Service Modules Pattern

Each service module exports typed functions for API calls:

**Soldiers Service (`soldiers.service.ts`):**
```typescript
export const soldiersService = {
  getAll: () => apiClient.get<Soldier[]>('/soldiers'),
  getById: (id: string) => apiClient.get<Soldier>(`/soldiers/${id}`),
  create: (data: CreateSoldierDto) => apiClient.post<Soldier>('/soldiers', data),
  update: (id: string, data: UpdateSoldierDto) => apiClient.patch<Soldier>(`/soldiers/${id}`, data),
  remove: (id: string) => apiClient.delete(`/soldiers/${id}`),
  addConstraint: (soldierId: string, data: CreateConstraintDto) =>
    apiClient.post<Soldier>(`/soldiers/${soldierId}/constraints`, data),
  removeConstraint: (soldierId: string, constraintId: string) =>
    apiClient.delete(`/soldiers/${soldierId}/constraints/${constraintId}`),
};
```

**Similar patterns for:**
- `tasks.service.ts`
- `assignments.service.ts`
- `settings.service.ts` (singleton, only get/update)

### React Query Hooks Pattern

Each resource gets custom hooks wrapping React Query:

**Query Hooks (for fetching):**
```typescript
// useSoldiers.ts
export const useSoldiers = () => {
  return useQuery({
    queryKey: ['soldiers'],
    queryFn: async () => {
      const response = await soldiersService.getAll();
      return response.data;
    },
  });
};
```

**Mutation Hooks (for create/update/delete):**
```typescript
export const useCreateSoldier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: soldiersService.create,
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
    mutationFn: soldiersService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soldiers'] });
      toast({ title: 'החייל נמחק בהצלחה' });
    },
  });
};
```

**Benefits:**
- Automatic caching with stale-while-revalidate strategy
- Automatic refetching on window focus
- Optimistic updates for better UX
- Error handling centralized
- Loading states managed automatically
- Query invalidation triggers refetch

---

## Component Updates & Data Flow

### Refactoring Strategy

**1. Soldiers Components (`SoldiersView.tsx`):**

**Before (Zustand):**
```typescript
const { soldiers, addSoldier, updateSoldier, deleteSoldier } = useSchedulingStore();
```

**After (React Query):**
```typescript
const { data: soldiers, isLoading, error } = useSoldiers();
const createSoldier = useCreateSoldier();
const updateSoldier = useUpdateSoldier();
const deleteSoldier = useDeleteSoldier();

// Usage in handlers
const handleCreate = (data) => {
  createSoldier.mutate(data);
};
```

**2. Tasks Components (`TasksView.tsx`):**
- Replace `useSchedulingStore()` with `useTasks()`
- Handle nested `requiredRoles` (TaskRole array) in forms
- Use mutations for create/update/delete

**3. Settings Components (`SettingsView.tsx`):**
- Use `useSettings()` (returns single settings object)
- Use `useUpdateSettings()` mutation
- Show loading state while saving

**4. Assignments/Schedule Components (`ScheduleView.tsx`):**
- Use multiple queries: `useAssignments()`, `useSoldiers()`, `useTasks()`
- Combine data from multiple queries for calendar view
- Create/delete assignments with mutations
- Handle `locked` field for manual overrides in UI

### Error Handling

**Strategy:**
- Show error messages using toast notifications (already configured in mutations)
- Display error states in components with retry button
- React Query automatic retry for failed requests (3 attempts)
- Fallback to empty state with helpful message

**Example:**
```typescript
const { data: soldiers, isLoading, error, refetch } = useSoldiers();

if (error) {
  return (
    <div className="text-center p-8">
      <p className="text-destructive mb-4">שגיאה בטעינת החיילים</p>
      <Button onClick={() => refetch()}>נסה שוב</Button>
    </div>
  );
}
```

### Loading States

**Strategy:**
- Skeleton loaders while fetching initial data
- Disable form buttons during mutations (`mutation.isLoading`)
- Show spinner in buttons during save operations
- Optimistic updates for instant feedback

**Example:**
```typescript
const createSoldier = useCreateSoldier();

<Button
  onClick={handleSubmit}
  disabled={createSoldier.isLoading}
>
  {createSoldier.isLoading ? 'שומר...' : 'שמור'}
</Button>
```

### Data Combination for Schedule View

The schedule view needs data from multiple sources:

```typescript
const { data: assignments, isLoading: assignmentsLoading } = useAssignments();
const { data: soldiers, isLoading: soldiersLoading } = useSoldiers();
const { data: tasks, isLoading: tasksLoading } = useTasks();

const isLoading = assignmentsLoading || soldiersLoading || tasksLoading;

// Combine data for display
const enrichedAssignments = assignments?.map(assignment => ({
  ...assignment,
  soldier: soldiers?.find(s => s.id === assignment.soldierId),
  task: tasks?.find(t => t.id === assignment.taskId),
}));
```

---

## Backend Entity Changes

### Constraint Entity Updates

**Current:**
```typescript
@Entity('constraints')
export class Constraint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  reason: string;
}
```

**Updated:**
```typescript
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
}
```

**DTO Updates:**
```typescript
export class CreateConstraintDto {
  @IsEnum(['unavailable', 'vacation', 'medical', 'other'])
  type: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
```

### Assignment Entity Updates

**Current:**
```typescript
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  soldierId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  shift: string;

  @Column()
  status: string;
}
```

**Updated:**
```typescript
@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column({ type: 'uuid' })
  soldierId: string;

  @Column()
  role: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: false })
  locked: boolean;
}
```

**DTO Updates:**
```typescript
export class CreateAssignmentDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  soldierId: string;

  @IsString()
  role: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;
}
```

---

## Implementation Phases

### Phase 1: Backend Updates
1. Update Constraint entity (date → startDate/endDate)
2. Update Assignment entity (new fields)
3. Update DTOs
4. Run migrations (TypeORM sync)
5. Update seed script
6. Test backend endpoints

### Phase 2: Frontend API Layer
1. Add environment variables
2. Create API client (axios)
3. Create service modules (soldiers, tasks, assignments, settings)
4. Create React Query hooks
5. Test API calls in isolation

### Phase 3: Component Migration
1. Update Soldiers components
2. Update Tasks components
3. Update Settings components
4. Update Schedule/Assignments components
5. Remove Zustand store
6. Test all CRUD operations

### Phase 4: Polish
1. Add loading skeletons
2. Improve error handling
3. Add optimistic updates
4. Test edge cases
5. Performance optimization

---

## Testing Strategy

**Manual Testing:**
- Test all CRUD operations for each resource
- Test nested operations (constraints)
- Test error scenarios (network failures, validation errors)
- Test loading states
- Test with backend down

**Integration Points to Verify:**
- Soldiers: create, update, delete, add/remove constraints
- Tasks: create, update, delete
- Assignments: create, delete, locked field
- Settings: get, update
- Date handling (frontend Date ↔ backend ISO strings)

---

## Success Criteria

✅ All Zustand store code removed
✅ All components use React Query hooks
✅ Backend entities match frontend types
✅ Full CRUD works for all resources
✅ Loading states show properly
✅ Error handling works gracefully
✅ Data persists across page refreshes (from backend)
✅ No console errors
✅ Hebrew text displays correctly
✅ Seed script creates compatible data
