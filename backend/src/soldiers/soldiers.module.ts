import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoldiersService } from './soldiers.service';
import { SoldiersController } from './soldiers.controller';
import { Soldier } from './entities/soldier.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Soldier])],
  controllers: [SoldiersController],
  providers: [SoldiersService],
  exports: [SoldiersService],
})
export class SoldiersModule {}
