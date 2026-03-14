import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension first
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "minBasePresence" integer NOT NULL DEFAULT 75,
        "totalSoldiers" integer NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_settings" PRIMARY KEY ("id")
      )
    `);

    // Create platoons table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "platoon" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "commander" character varying,
        "color" character varying NOT NULL,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platoon" PRIMARY KEY ("id")
      )
    `);

    // Create soldiers table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soldier" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "rank" character varying NOT NULL DEFAULT 'טוראי',
        "roles" text NOT NULL DEFAULT '[]',
        "maxVacationDays" integer NOT NULL DEFAULT 14,
        "usedVacationDays" integer NOT NULL DEFAULT 0,
        "platoonId" uuid,
        CONSTRAINT "PK_soldier" PRIMARY KEY ("id"),
        CONSTRAINT "FK_soldier_platoon" FOREIGN KEY ("platoonId") REFERENCES "platoon"("id") ON DELETE SET NULL
      )
    `);

    // Create constraints table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "constraint" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "reason" character varying,
        "soldierId" uuid,
        CONSTRAINT "PK_constraint" PRIMARY KEY ("id"),
        CONSTRAINT "FK_constraint_soldier" FOREIGN KEY ("soldierId") REFERENCES "soldier"("id") ON DELETE CASCADE
      )
    `);

    // Create tasks table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "task" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "shiftStartHour" integer NOT NULL DEFAULT 8,
        "shiftDuration" integer NOT NULL DEFAULT 8,
        "restTimeBetweenShifts" integer NOT NULL DEFAULT 12,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_task" PRIMARY KEY ("id")
      )
    `);

    // Create task_role table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "task_role" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" character varying NOT NULL,
        "count" integer NOT NULL DEFAULT 1,
        "taskId" uuid,
        CONSTRAINT "PK_task_role" PRIMARY KEY ("id"),
        CONSTRAINT "FK_task_role_task" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE
      )
    `);

    // Create assignments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "assignment" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" character varying NOT NULL,
        "startTime" TIMESTAMP NOT NULL,
        "endTime" TIMESTAMP NOT NULL,
        "locked" boolean NOT NULL DEFAULT false,
        "taskId" uuid,
        "soldierId" uuid,
        CONSTRAINT "PK_assignment" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assignment_task" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assignment_soldier" FOREIGN KEY ("soldierId") REFERENCES "soldier"("id") ON DELETE CASCADE
      )
    `);

    // Insert default settings if not exists
    await queryRunner.query(`
      INSERT INTO "settings" ("minBasePresence", "totalSoldiers")
      SELECT 75, 0
      WHERE NOT EXISTS (SELECT 1 FROM "settings")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "assignment"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task_role"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "task"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "constraint"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "soldier"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "platoon"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "settings"`);
  }
}
