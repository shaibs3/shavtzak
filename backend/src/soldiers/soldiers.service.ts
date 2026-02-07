import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Soldier } from './entities/soldier.entity';
import { Constraint } from './entities/constraint.entity';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';
import { CreateConstraintDto } from './dto/create-constraint.dto';

@Injectable()
export class SoldiersService {
  constructor(
    @InjectRepository(Soldier)
    private soldiersRepository: Repository<Soldier>,
    @InjectRepository(Constraint)
    private constraintsRepository: Repository<Constraint>,
  ) {}

  async create(createSoldierDto: CreateSoldierDto): Promise<Soldier> {
    const soldier = this.soldiersRepository.create(createSoldierDto);
    return this.soldiersRepository.save(soldier);
  }

  async findAll(): Promise<Soldier[]> {
    return this.soldiersRepository.find();
  }

  async findOne(id: string): Promise<Soldier> {
    const soldier = await this.soldiersRepository.findOne({ where: { id } });
    if (!soldier) {
      throw new NotFoundException(`Soldier with ID ${id} not found`);
    }
    return soldier;
  }

  async update(
    id: string,
    updateSoldierDto: UpdateSoldierDto,
  ): Promise<Soldier> {
    await this.findOne(id); // Check if exists
    await this.soldiersRepository.update(id, updateSoldierDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const soldier = await this.findOne(id);
    await this.soldiersRepository.remove(soldier);
  }

  async addConstraint(
    soldierId: string,
    createConstraintDto: CreateConstraintDto,
  ): Promise<Constraint> {
    const soldier = await this.findOne(soldierId);
    const constraint = this.constraintsRepository.create({
      ...createConstraintDto,
      soldier,
    });
    return this.constraintsRepository.save(constraint);
  }

  async removeConstraint(
    soldierId: string,
    constraintId: string,
  ): Promise<void> {
    await this.findOne(soldierId); // Verify soldier exists
    const constraint = await this.constraintsRepository.findOne({
      where: { id: constraintId },
      relations: ['soldier'],
    });

    if (!constraint) {
      throw new NotFoundException(
        `Constraint with ID ${constraintId} not found`,
      );
    }

    if (constraint.soldier.id !== soldierId) {
      throw new NotFoundException(
        `Constraint ${constraintId} does not belong to soldier ${soldierId}`,
      );
    }

    await this.constraintsRepository.remove(constraint);
  }

  async bulkUpdate(
    soldierIds: string[],
    platoonId: string | null,
  ): Promise<{ updatedCount: number }> {
    const result = await this.soldiersRepository.update(
      { id: In(soldierIds) },
      { platoonId: platoonId },
    );

    return { updatedCount: result.affected || 0 };
  }
}
