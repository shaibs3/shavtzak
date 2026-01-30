import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { SoldiersModule } from './soldiers/soldiers.module';
import { TasksModule } from './tasks/tasks.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SettingsModule } from './settings/settings.module';
import { PlatoonsModule } from './platoons/platoons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    SoldiersModule,
    TasksModule,
    AssignmentsModule,
    SettingsModule,
    PlatoonsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
