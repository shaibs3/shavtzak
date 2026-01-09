import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { SoldiersModule } from './soldiers/soldiers.module';
import { TasksModule } from './tasks/tasks.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LeaveModule } from './leave/leave.module';
import { DeploymentModule } from './deployment/deployment.module';
import { ValidationModule } from './validation/validation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SoldiersModule,
    TasksModule,
    ShiftsModule,
    LeaveModule,
    DeploymentModule,
    ValidationModule,
  ],
})
export class AppModule {}
