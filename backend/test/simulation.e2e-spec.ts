import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { seed } from '../src/database/seeds/seed';

interface SoldierResponse {
  id: string;
  name: string;
  roles: string[];
  constraints: Array<{ type: string; reason: string }>;
}

interface TaskResponse {
  id: string;
  name: string;
  isActive: boolean;
}

interface AssignmentResponse {
  id: string;
  soldierId: string;
  taskId: string;
}

interface SettingsResponse {
  operationalStartDate: string;
  operationalEndDate: string;
}

describe('API Simulation (e2e)', () => {
  let app: INestApplication;
  let httpServer: App;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    httpServer = app.getHttpServer() as App;

    // Seed the database
    const dataSource = moduleFixture.get(DataSource);
    await seed(dataSource);

    // Get auth token via test-login endpoint
    const loginRes = await request(httpServer)
      .post('/api/auth/test-login')
      .expect(201);
    authToken = (loginRes.body as { token: string }).token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  async function getSoldiers(): Promise<SoldierResponse[]> {
    const res = await request(httpServer)
      .get('/api/soldiers')
      .set('Authorization', `Bearer ${authToken}`);
    return res.body as SoldierResponse[];
  }

  async function getTasks(): Promise<TaskResponse[]> {
    const res = await request(httpServer)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`);
    return res.body as TaskResponse[];
  }

  it('should have seeded soldiers', async () => {
    const soldiers = await getSoldiers();
    expect(soldiers.length).toBeGreaterThanOrEqual(70);
  });

  it('should have seeded tasks', async () => {
    const tasks = await getTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(2);
  });

  it('should have seeded platoons', async () => {
    const res = await request(httpServer)
      .get('/api/platoons')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect((res.body as unknown[]).length).toBeGreaterThanOrEqual(5);
  });

  it('should create an assignment and retrieve it', async () => {
    const soldiers = await getSoldiers();
    const tasks = await getTasks();

    const assignment = {
      soldierId: soldiers[0].id,
      taskId: tasks[0].id,
      role: 'soldier',
      startTime: '2026-02-01T06:00:00.000Z',
      endTime: '2026-02-01T14:00:00.000Z',
      locked: false,
    };

    const createRes = await request(httpServer)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .send(assignment)
      .expect(201);

    const created = createRes.body as AssignmentResponse;
    expect(created.id).toBeDefined();
    expect(created.soldierId).toBe(soldiers[0].id);

    // Verify it's retrievable
    const getRes = await request(httpServer)
      .get(`/api/assignments/${created.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect((getRes.body as AssignmentResponse).soldierId).toBe(soldiers[0].id);
  });

  it('should batch create assignments', async () => {
    const soldiers = await getSoldiers();
    const tasks = await getTasks();

    const assignments = [
      {
        soldierId: soldiers[1].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-02T06:00:00.000Z',
        endTime: '2026-02-02T14:00:00.000Z',
        locked: false,
      },
      {
        soldierId: soldiers[2].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-02T06:00:00.000Z',
        endTime: '2026-02-02T14:00:00.000Z',
        locked: false,
      },
    ];

    const res = await request(httpServer)
      .post('/api/assignments/batch')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ assignments, replaceNonLocked: false })
      .expect(201);

    expect((res.body as unknown[]).length).toBe(2);
  });

  it('should add constraint and verify it on soldier', async () => {
    const soldiers = await getSoldiers();
    const soldier = soldiers[0];

    // Add medical constraint
    const constraintRes = await request(httpServer)
      .post(`/api/soldiers/${soldier.id}/constraints`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'medical',
        reason: 'פציעה',
        startDate: '2026-03-01',
        endDate: '2026-03-07',
      })
      .expect(201);

    expect((constraintRes.body as { type: string }).type).toBe('medical');

    // Verify soldier has constraint
    const getRes = await request(httpServer)
      .get(`/api/soldiers/${soldier.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const updatedSoldier = getRes.body as SoldierResponse;
    const hasConstraint = updatedSoldier.constraints.some(
      (c) => c.type === 'medical' && c.reason === 'פציעה',
    );
    expect(hasConstraint).toBe(true);
  });

  it('should delete assignment and verify removal', async () => {
    const soldiers = await getSoldiers();
    const tasks = await getTasks();

    // Create
    const createRes = await request(httpServer)
      .post('/api/assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        soldierId: soldiers[5].id,
        taskId: tasks[0].id,
        role: 'soldier',
        startTime: '2026-02-10T06:00:00.000Z',
        endTime: '2026-02-10T14:00:00.000Z',
        locked: false,
      })
      .expect(201);

    const created = createRes.body as AssignmentResponse;

    // Delete
    await request(httpServer)
      .delete(`/api/assignments/${created.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // Verify gone
    await request(httpServer)
      .get(`/api/assignments/${created.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('should update settings and verify operational period', async () => {
    await request(httpServer)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        operationalStartDate: '2026-02-01',
        operationalEndDate: '2026-05-31',
        minBasePresence: 75,
        totalSoldiers: 70,
      })
      .expect(200);

    const getRes = await request(httpServer)
      .get('/api/settings')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const settings = getRes.body as SettingsResponse;
    expect(settings.operationalStartDate).toContain('2026-02-01');
    expect(settings.operationalEndDate).toContain('2026-05-31');
  });

  it('should handle task deactivation', async () => {
    const tasks = await getTasks();
    const task = tasks[0];

    // Deactivate
    await request(httpServer)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isActive: false })
      .expect(200);

    // Verify
    const getRes = await request(httpServer)
      .get(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const updated = getRes.body as TaskResponse;
    expect(updated.isActive).toBe(false);

    // Reactivate for other tests
    await request(httpServer)
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ isActive: true })
      .expect(200);
  });
});
