import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../../config/database.config';
import { Soldier } from '../../soldiers/entities/soldier.entity';

async function removeSoldierRole() {
  const dataSource = new DataSource(databaseConfig as DataSourceOptions);

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');

    const soldierRepo = dataSource.getRepository(Soldier);
    
    // Find all soldiers with 'soldier' role
    const soldiersWithSoldierRole = await dataSource
      .createQueryBuilder()
      .select('soldier')
      .from(Soldier, 'soldier')
      .where("soldier.roles LIKE '%soldier%'")
      .getMany();

    console.log(`Found ${soldiersWithSoldierRole.length} soldiers with 'soldier' role`);
    
    let updatedCount = 0;
    for (const soldier of soldiersWithSoldierRole) {
      const rolesValue = soldier.roles as string | string[];
      let rolesArray: string[] = [];
      
      if (typeof rolesValue === 'string') {
        rolesArray = rolesValue.split(',').map(r => r.trim()).filter(r => r.length > 0);
      } else if (Array.isArray(rolesValue)) {
        rolesArray = [...rolesValue];
      }
      
      const hasSoldierRole = rolesArray.some(r => r.toLowerCase() === 'soldier');
      
      if (hasSoldierRole) {
        // Remove 'soldier' role - everyone is a soldier by default
        const newRoles = rolesArray.filter(role => role.toLowerCase() !== 'soldier');
        soldier.roles = newRoles;
        
        await soldierRepo.save(soldier);
        updatedCount++;
        const before = rolesArray.join(', ');
        const after = newRoles.length > 0 ? newRoles.join(', ') : '(ללא תפקידים מיוחדים)';
        console.log(`Updated ${soldier.name}: ${before} -> ${after}`);
      }
    }

    console.log(`\n✅ Successfully removed 'soldier' role from ${updatedCount} soldiers`);
    console.log('Note: Everyone is a soldier by default, so this role is no longer needed.');
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

removeSoldierRole();
