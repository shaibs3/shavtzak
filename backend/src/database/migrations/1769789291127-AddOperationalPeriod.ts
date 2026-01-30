import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOperationalPeriod1769789291127 implements MigrationInterface {
    name = 'AddOperationalPeriod1769789291127'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" ADD "operationalStartDate" date`);
        await queryRunner.query(`ALTER TABLE "settings" ADD "operationalEndDate" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "operationalEndDate"`);
        await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "operationalStartDate"`);
    }

}
