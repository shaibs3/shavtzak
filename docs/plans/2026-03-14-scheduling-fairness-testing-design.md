# Scheduling Fairness Testing Design

## Overview

This document outlines the testing strategy for the scheduling algorithm (`buildFairWeekSchedule`) to verify both correctness (rules are respected) and fairness (equal distribution).

## Current State

- **Algorithm Location**: `frontend/src/lib/scheduling/fairScheduling.ts`
- **Existing Tests**: Basic E2E in `frontend/tests/e2e/schedule.spec.ts` (only checks auto-schedule runs)
- **Missing**: Unit tests for algorithm logic, fairness metrics validation, multi-week simulations

## Testing Goals

### Correctness (Rules)
1. **Rest Time**: Minimum rest between shifts is respected
2. **Night Shifts**: No consecutive night shifts for same soldier
3. **Constraints**: Vacation, medical, unavailable dates honored
4. **Roles**: Only qualified soldiers assigned to specialized roles
5. **Conflicts**: No overlapping assignments for same soldier
6. **Locks**: Locked assignments never removed

### Fairness (Distribution)
1. **Soldier Balance**: Hours distributed within 20% deviation
2. **Platoon Balance**: Hours distributed within 15% deviation
3. **Rotation**: Daily platoon rotation to avoid bias

## File Structure

```
frontend/src/lib/scheduling/
├── fairScheduling.ts                    # Existing algorithm
├── __tests__/
│   ├── fairScheduling.correctness.test.ts
│   ├── fairScheduling.fairness.test.ts
│   └── fairScheduling.simulation.test.ts
└── testUtils/
    └── fixtures.ts

frontend/tests/e2e/
├── schedule.spec.ts                     # Existing
├── schedule-fairness.spec.ts            # New
└── schedule-simulation.spec.ts          # New
```

## Unit Tests

### fixtures.ts

Helper functions for test data generation:

```typescript
interface TestSoldier {
  id: string;
  name: string;
  roles: string[];
  platoonId: string;
  constraints: Constraint[];
}

function createSoldier(overrides?: Partial<TestSoldier>): Soldier;
function createPlatoon(soldierCount: number, overrides?: Partial<Platoon>): { platoon: Platoon; soldiers: Soldier[] };
function createTask(overrides?: Partial<Task>): Task;
function createScenario(config: {
  platoonCount: number;
  soldiersPerPlatoon: number;
  taskCount: number;
}): {
  platoons: Platoon[];
  soldiers: Soldier[];
  tasks: Task[];
};
```

### correctness.test.ts

```typescript
describe('Correctness Rules', () => {
  describe('Rest Time', () => {
    it('respects minimum rest between shifts');
    it('allows assignment when rest time is exactly met');
    it('rejects assignment when rest time is insufficient');
  });

  describe('Night Shifts', () => {
    it('prevents consecutive night shifts');
    it('allows night shift after day shift');
    it('correctly identifies night shifts (22:00-06:00)');
  });

  describe('Constraints', () => {
    it('respects vacation constraints');
    it('respects medical constraints');
    it('respects unavailable constraints');
    it('handles constraint that spans multiple days');
  });

  describe('Roles', () => {
    it('assigns drivers only to soldiers with driver role');
    it('assigns commanders only to soldiers with commander role');
    it('assigns any soldier to "soldier" role');
    it('fails when no qualified soldier available for role');
  });

  describe('Conflicts', () => {
    it('prevents overlapping assignments for same soldier');
    it('allows adjacent non-overlapping assignments');
  });

  describe('Locks', () => {
    it('preserves locked assignments');
    it('works around locked assignments for same slot');
    it('respects locked platoon when filling remaining roles');
  });
});
```

### fairness.test.ts

```typescript
describe('Fairness Metrics', () => {
  describe('Soldier Balance', () => {
    it('distributes hours within 20% deviation between soldiers');
    it('prefers soldier with fewer hours when choosing');
    it('uses count as tiebreaker when hours are equal');
    it('random tiebreaker for equal hours and count');
  });

  describe('Platoon Balance', () => {
    it('distributes hours within 15% deviation between platoons');
    it('prioritizes platoon with fewer hours');
    it('rotates platoons daily to avoid systematic bias');
  });

  describe('Edge Cases', () => {
    it('handles platoon with fewer available soldiers');
    it('handles uneven platoon sizes');
    it('handles platoon where many soldiers have constraints');
    it('handles tasks requiring rare roles');
  });
});
```

### simulation.test.ts

```typescript
interface SimulationReport {
  weeksSim: number;
  totalAssignments: number;
  unfilledSlots: number;

  soldierStats: {
    minHours: number;
    maxHours: number;
    avgHours: number;
    stdDev: number;
    deviationPercent: number;
  };

  platoonStats: {
    [platoonId: string]: {
      totalHours: number;
      soldierCount: number;
      avgPerSoldier: number;
    };
  };

  ruleViolations: {
    restTimeViolations: number;
    consecutiveNightViolations: number;
    constraintViolations: number;
    roleViolations: number;
  };
}

function runSimulation(config: {
  scenario: ReturnType<typeof createScenario>;
  weeks: number;
  weeklyChanges?: (week: number, state: SimState) => void;
}): SimulationReport;

describe('Multi-Week Simulations', () => {
  describe('4-Week Baseline', () => {
    it('maintains fairness over 4 weeks with stable configuration', () => {
      const scenario = createScenario({
        platoonCount: 3,
        soldiersPerPlatoon: 20,
        taskCount: 3,
      });

      const report = runSimulation({ scenario, weeks: 4 });

      expect(report.ruleViolations.restTimeViolations).toBe(0);
      expect(report.ruleViolations.consecutiveNightViolations).toBe(0);
      expect(report.soldierStats.deviationPercent).toBeLessThan(20);
      expect(report.unfilledSlots).toBe(0);
    });
  });

  describe('Dynamic Changes', () => {
    it('adapts to new constraints mid-period', () => {
      const scenario = createScenario({
        platoonCount: 3,
        soldiersPerPlatoon: 15,
        taskCount: 2,
      });

      const report = runSimulation({
        scenario,
        weeks: 4,
        weeklyChanges: (week, state) => {
          if (week === 3) {
            // Add constraints to 5 soldiers
            state.soldiers.slice(0, 5).forEach(s => {
              s.constraints.push({
                id: `c-${s.id}`,
                type: 'vacation',
                startDate: state.weekStart,
                endDate: addDays(state.weekStart, 7),
              });
            });
          }
        },
      });

      expect(report.ruleViolations.constraintViolations).toBe(0);
      expect(report.soldierStats.deviationPercent).toBeLessThan(25);
    });

    it('adapts to task changes mid-period', () => {
      // Week 1-2: 2 tasks
      // Week 3-4: Add third task
      // Assert: New task distributed fairly
    });

    it('handles soldiers joining/leaving', () => {
      // Week 1-2: 50 soldiers
      // Week 3: 5 leave, 3 join
      // Assert: Rebalances appropriately
    });
  });

  describe('Stress Scenarios', () => {
    it('handles understaffed platoon', () => {
      // One platoon with 5 soldiers, others with 20
      // Assert: Small platoon not overworked
    });

    it('handles peak constraint period (holidays)', () => {
      // 40% of soldiers on vacation simultaneously
      // Assert: Unfilled slots minimized or zero
    });

    it('handles role scarcity', () => {
      // Only 2 drivers across all platoons, task needs driver
      // Assert: Drivers not overworked, fair rotation
    });
  });
});
```

## E2E Tests

### schedule-fairness.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('Schedule Fairness E2E', () => {
  test.beforeEach(async ({ request }) => {
    // Reset DB to known state via API
    await request.post('/api/test/reset');

    // Create test data via API
    await request.post('/api/test/seed', {
      data: {
        platoons: 3,
        soldiersPerPlatoon: 10,
        tasks: 2,
      },
    });
  });

  test('auto-schedule distributes fairly across platoons', async ({ page, request }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.click('button:has-text("שיבוצים")');

    // Run auto-schedule
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם');

    // Fetch assignments via API
    const response = await request.get('/api/assignments');
    const assignments = await response.json();

    // Calculate hours per platoon
    const hoursByPlatoon = calculateHoursByPlatoon(assignments);
    const deviation = calculateDeviation(Object.values(hoursByPlatoon));

    expect(deviation).toBeLessThan(0.20); // 20%
  });

  test('locked assignments are respected', async ({ page, request }) => {
    await loginAsTestUser(page);
    // ... create and lock assignment
    // ... run auto-schedule
    // ... verify locked assignment still exists
  });
});
```

### schedule-simulation.spec.ts

```typescript
test.describe('Full Simulation E2E', () => {
  test('2-week simulation with dynamic changes', async ({ page, request }) => {
    await loginAsTestUser(page);
    const week1Start = startOfWeek(new Date());
    const week2Start = addWeeks(week1Start, 1);

    // Week 1
    await navigateToWeek(page, week1Start);
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם');
    const stats1 = await collectStats(request);

    // Add constraint via API
    const soldiers = await request.get('/api/soldiers').then(r => r.json());
    await request.post(`/api/soldiers/${soldiers[0].id}/constraints`, {
      data: {
        type: 'vacation',
        startDate: week2Start.toISOString(),
        endDate: addDays(week2Start, 5).toISOString(),
      },
    });

    // Week 2
    await navigateToWeek(page, week2Start);
    await page.click('button:has-text("שיבוץ אוטומטי")');
    await page.waitForSelector('text=שיבוץ אוטומטי הושלם');
    const stats2 = await collectStats(request);

    // Assert fairness maintained
    expect(stats2.soldierDeviationPercent).toBeLessThan(25);
    expect(stats2.ruleViolations).toBe(0);
  });
});
```

## Success Thresholds

| Metric | Threshold |
|--------|-----------|
| Soldier hours deviation | < 20% |
| Platoon hours deviation | < 15% |
| Unfilled slots | 0 (or < 5% in stress scenarios) |
| Rule violations | 0 |

## Implementation Order

| Step | Component | Description |
|------|-----------|-------------|
| 1 | `fixtures.ts` | Test data generation utilities |
| 2 | `correctness.test.ts` | Verify rules are enforced |
| 3 | `fairness.test.ts` | Verify fair distribution |
| 4 | `simulation.test.ts` | Multi-week simulations |
| 5 | `schedule-fairness.spec.ts` | E2E fairness tests |
| 6 | `schedule-simulation.spec.ts` | E2E full simulations |

## Running Tests

```bash
# Unit tests
cd frontend && npm run test -- fairScheduling

# Unit tests in watch mode
cd frontend && npm run test -- fairScheduling --watch

# E2E (requires backend running)
cd frontend && npm run test:e2e -- schedule-fairness

# All scheduling tests
cd frontend && npm run test:e2e -- schedule
```

## Notes

- The algorithm currently runs in the frontend (`buildFairWeekSchedule`)
- Assignments are persisted to backend via API calls
- E2E tests need running backend with test database
- Consider adding a `/api/test/reset` endpoint for E2E test isolation