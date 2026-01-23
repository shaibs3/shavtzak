import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldiersController } from './soldiers.controller';
import { SoldiersService } from './soldiers.service';
import { Soldier } from './entities/soldier.entity';
import { Constraint } from './entities/constraint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Soldier, Constraint])],
  controllers: [SoldiersController],
  providers: [SoldiersService],
  exports: [SoldiersService],
})
export class SoldiersModule {}
