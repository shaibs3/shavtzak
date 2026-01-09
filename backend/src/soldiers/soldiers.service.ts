import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Soldier } from './entities/soldier.entity';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';

@Injectable()
export class SoldiersService {
  constructor(
    @InjectRepository(Soldier)
    private soldiersRepository: Repository<Soldier>,
  ) {}

  async create(createSoldierDto: CreateSoldierDto): Promise<Soldier> {
    const soldier = this.soldiersRepository.create(createSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async findAll(): Promise<Soldier[]> {
    return this.soldiersRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Soldier> {
    const soldier = await this.soldiersRepository.findOne({ where: { id } });
    if (!soldier) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
    return soldier;
  }

  async update(id: string, updateSoldierDto: UpdateSoldierDto): Promise<Soldier> {
    const soldier = await this.findOne(id);
    Object.assign(soldier, updateSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async remove(id: string): Promise<void> {
    const result = await this.soldiersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
  }
}
