import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface SettingsResponse {
  operationalStartDate: string;
  operationalEndDate: string;
}

describe('Operational Period (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/settings (PATCH) - should set operational period', () => {
    return request(app.getHttpServer() as App)
      .patch('/api/settings')
      .send({
        operationalStartDate: '2026-02-01',
        operationalEndDate: '2026-05-31',
      })
      .expect(200)
      .expect((res: request.Response) => {
        const body = res.body as SettingsResponse;
        expect(body.operationalStartDate).toBe('2026-02-01');
        expect(body.operationalEndDate).toBe('2026-05-31');
      });
  });

  it('/api/settings (PATCH) - should reject invalid operational period', () => {
    return request(app.getHttpServer() as App)
      .patch('/api/settings')
      .send({
        operationalStartDate: '2026-05-31',
        operationalEndDate: '2026-02-01',
      })
      .expect(400);
  });

  it('/api/settings (PATCH) - should reject partial operational period', () => {
    return request(app.getHttpServer() as App)
      .patch('/api/settings')
      .send({
        operationalStartDate: '2026-02-01',
      })
      .expect(400);
  });
});
