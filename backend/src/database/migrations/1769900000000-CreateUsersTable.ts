import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1769900000000 implements MigrationInterface {
  name = 'CreateUsersTable1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('users');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'email',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
            },
            {
              name: 'picture',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'googleId',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'role',
              type: 'varchar',
              default: "'viewer'",
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
