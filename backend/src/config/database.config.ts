import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const isProduction = process.env.NODE_ENV === 'production';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'shavtzak',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // NEVER use synchronize in production - use migrations instead
  synchronize: !isProduction,
  // Disable verbose SQL logging in production
  logging: !isProduction,
  // SSL for production database connections
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
