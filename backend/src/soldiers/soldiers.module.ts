import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldiersController } from './soldiers.controller';
import { SoldiersService } from './soldiers.service';
import { Soldier } from './entities/soldier.entity';
import { Constraint } from './entities/constraint.entity';
import { PlatoonsModule } from '../platoons/platoons.module';

@Module({
  imports: [TypeOrmModule.forFeature([Soldier, Constraint]), PlatoonsModule],
  controllers: [SoldiersController],
  providers: [SoldiersService],
  exports: [SoldiersService],
})
export class SoldiersModule {}
