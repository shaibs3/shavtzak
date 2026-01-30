import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatoonsController } from './platoons.controller';
import { PlatoonsService } from './platoons.service';
import { Platoon } from './entities/platoon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Platoon])],
  controllers: [PlatoonsController],
  providers: [PlatoonsService],
  exports: [PlatoonsService],
})
export class PlatoonsModule {}
