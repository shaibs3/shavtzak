import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../../config/database.config';
import { seed } from './seed';

async function runSeed() {
  const dataSource = new DataSource(databaseConfig as DataSourceOptions);

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('Database connection established');

    await seed(dataSource);

    console.log('\nSeed script completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

runSeed();
