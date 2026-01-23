import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Soldier, Task, Assignment, ScheduleSettings, Constraint } from '@/types/scheduling';

interface SchedulingState {
  soldiers: Soldier[];
  tasks: Task[];
  assignments: Assignment[];
  settings: ScheduleSettings;
  
  // Soldier actions
  addSoldier: (soldier: Omit<Soldier, 'id'>) => void;
  updateSoldier: (id: string, updates: Partial<Soldier>) => void;
  deleteSoldier: (id: string) => void;
  addConstraint: (soldierId: string, constraint: Omit<Constraint, 'id'>) => void;
  removeConstraint: (soldierId: string, constraintId: string) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Assignment actions
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  removeAssignment: (id: string) => void;
  setAssignments: (assignments: Assignment[]) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<ScheduleSettings>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useSchedulingStore = create<SchedulingState>()(
  persist(
    (set) => ({
      soldiers: [
        {
          id: '1',
          name: 'יוסי כהן',
          rank: 'סמל',
          roles: ['driver', 'soldier'],
          constraints: [],
          maxVacationDays: 5,
          usedVacationDays: 1,
        },
        {
          id: '2',
          name: 'דני לוי',
          rank: 'רב"ט',
          roles: ['commander', 'soldier'],
          constraints: [],
          maxVacationDays: 5,
          usedVacationDays: 0,
        },
        {
          id: '3',
          name: 'משה ישראלי',
          rank: 'טוראי',
          roles: ['radio_operator', 'soldier'],
          constraints: [],
          maxVacationDays: 5,
          usedVacationDays: 2,
        },
      ],
      tasks: [
        {
          id: '1',
          name: 'שמירה בשער',
          description: 'משמרת שמירה בכניסה הראשית',
          requiredRoles: [
            { role: 'commander', count: 1 },
            { role: 'soldier', count: 2 },
          ],
           shiftStartHour: 8,
          shiftDuration: 8,
          restTimeBetweenShifts: 12,
          isActive: true,
        },
        {
          id: '2',
          name: 'סיור',
          description: 'סיור מבצעי בגזרה',
          requiredRoles: [
            { role: 'commander', count: 1 },
            { role: 'driver', count: 1 },
            { role: 'radio_operator', count: 1 },
            { role: 'soldier', count: 2 },
          ],
           shiftStartHour: 8,
          shiftDuration: 6,
          restTimeBetweenShifts: 8,
          isActive: true,
        },
      ],
      assignments: [],
      settings: {
        minBasePresence: 75,
        totalSoldiers: 20,
      },

      addSoldier: (soldier) =>
        set((state) => ({
          soldiers: [...state.soldiers, { ...soldier, id: generateId() }],
        })),

      updateSoldier: (id, updates) =>
        set((state) => ({
          soldiers: state.soldiers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),

      deleteSoldier: (id) =>
        set((state) => ({
          soldiers: state.soldiers.filter((s) => s.id !== id),
        })),

      addConstraint: (soldierId, constraint) =>
        set((state) => ({
          soldiers: state.soldiers.map((s) =>
            s.id === soldierId
              ? {
                  ...s,
                  constraints: [...s.constraints, { ...constraint, id: generateId() }],
                }
              : s
          ),
        })),

      removeConstraint: (soldierId, constraintId) =>
        set((state) => ({
          soldiers: state.soldiers.map((s) =>
            s.id === soldierId
              ? {
                  ...s,
                  constraints: s.constraints.filter((c) => c.id !== constraintId),
                }
              : s
          ),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, { ...task, id: generateId() }],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [...state.assignments, { ...assignment, id: generateId() }],
        })),

      removeAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),

      setAssignments: (assignments) =>
        set(() => ({
          assignments,
        })),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: 'military-scheduling-storage',
    }
  )
);
