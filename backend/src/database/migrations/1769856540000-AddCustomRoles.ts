import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomRoles1769856540000 implements MigrationInterface {
    name = 'AddCustomRoles1769856540000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const table = await queryRunner.getTable("settings");
        const hasColumn = table?.findColumnByName("customRoles");
        
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "settings" ADD "customRoles" text`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("settings");
        const hasColumn = table?.findColumnByName("customRoles");
        
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "customRoles"`);
        }
    }
}
