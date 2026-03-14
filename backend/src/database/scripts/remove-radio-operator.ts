import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../../config/database.config';
import { Soldier } from '../../soldiers/entities/soldier.entity';

async function removeRadioOperator() {
  const dataSource = new DataSource(databaseConfig as DataSourceOptions);

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');

    const soldierRepo = dataSource.getRepository(Soldier);

    // First, find all soldiers using a raw query to catch all cases
    const soldiersWithRadioOperator = await dataSource
      .createQueryBuilder()
      .select('soldier')
      .from(Soldier, 'soldier')
      .where("soldier.roles LIKE '%radio_operator%'")
      .getMany();

    console.log(
      `Found ${soldiersWithRadioOperator.length} soldiers with radio_operator`,
    );

    let updatedCount = 0;
    for (const soldier of soldiersWithRadioOperator) {
      // Ensure roles is an array (TypeORM simple-array might return string)
      let rolesArray: string[] = [];
      const rolesValue = soldier.roles as string | string[];
      if (typeof rolesValue === 'string') {
        rolesArray = rolesValue
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
      } else if (Array.isArray(rolesValue)) {
        rolesArray = [...rolesValue];
      }

      // Check if radio_operator exists (case-insensitive check)
      const hasRadioOperator = rolesArray.some(
        (r) => r.toLowerCase() === 'radio_operator',
      );

      if (hasRadioOperator) {
        const newRoles = rolesArray.filter(
          (role) => role.toLowerCase() !== 'radio_operator',
        );

        // Ensure at least one role remains
        if (newRoles.length === 0) {
          newRoles.push('soldier');
        }

        // If we have other roles besides soldier, remove soldier
        if (newRoles.includes('soldier') && newRoles.length > 1) {
          soldier.roles = newRoles.filter((r) => r !== 'soldier');
        } else {
          soldier.roles = newRoles;
        }

        await soldierRepo.save(soldier);
        updatedCount++;
        console.log(
          `Updated ${soldier.name}: ${rolesArray.join(', ')} -> ${soldier.roles.join(', ')}`,
        );
      }
    }

    // Also check all soldiers to be safe
    const allSoldiers = await soldierRepo.find();
    let additionalCount = 0;
    for (const soldier of allSoldiers) {
      let rolesArray: string[] = [];
      const rolesValue = soldier.roles as string | string[];
      if (typeof rolesValue === 'string') {
        rolesArray = rolesValue
          .split(',')
          .map((r) => r.trim())
          .filter((r) => r.length > 0);
      } else if (Array.isArray(rolesValue)) {
        rolesArray = [...rolesValue];
      }

      const hasRadioOperator = rolesArray.some(
        (r) => r.toLowerCase() === 'radio_operator',
      );
      if (
        hasRadioOperator &&
        !soldiersWithRadioOperator.find((s) => s.id === soldier.id)
      ) {
        const newRoles = rolesArray.filter(
          (role) => role.toLowerCase() !== 'radio_operator',
        );
        if (newRoles.length === 0) {
          newRoles.push('soldier');
        }
        if (newRoles.includes('soldier') && newRoles.length > 1) {
          soldier.roles = newRoles.filter((r) => r !== 'soldier');
        } else {
          soldier.roles = newRoles;
        }
        await soldierRepo.save(soldier);
        additionalCount++;
        console.log(
          `Updated ${soldier.name}: ${rolesArray.join(', ')} -> ${soldier.roles.join(', ')}`,
        );
      }
    }

    console.log(
      `\n✅ Successfully removed radio_operator from ${updatedCount + additionalCount} soldiers`,
    );
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

removeRadioOperator();
