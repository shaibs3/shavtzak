import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftsRepository: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private assignmentsRepository: Repository<ShiftAssignment>,
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const { assignments, ...shiftData } = createShiftDto;

    // Create shift
    const shift = this.shiftsRepository.create(shiftData);
    const savedShift = await this.shiftsRepository.save(shift);

    // Create assignments
    if (assignments && assignments.length > 0) {
      const shiftAssignments = assignments.map(assignment =>
        this.assignmentsRepository.create({
          shiftId: savedShift.id,
          ...assignment,
        })
      );
      await this.assignmentsRepository.save(shiftAssignments);
    }

    return this.findOne(savedShift.id);
  }

  async findAll(): Promise<Shift[]> {
    return this.shiftsRepository.find({
      relations: ['task', 'approver', 'assignments', 'assignments.soldier'],
      order: { startTime: 'DESC' },
    });
  }

  async findByDate(startDate: string, endDate: string): Promise<Shift[]> {
    return this.shiftsRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.task', 'task')
      .leftJoinAndSelect('shift.approver', 'approver')
      .leftJoinAndSelect('shift.assignments', 'assignments')
      .leftJoinAndSelect('assignments.soldier', 'soldier')
      .where('shift.startTime >= :startDate', { startDate })
      .andWhere('shift.endTime <= :endDate', { endDate })
      .orderBy('shift.startTime', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<Shift> {
    const shift = await this.shiftsRepository.findOne({
      where: { id },
      relations: ['task', 'approver', 'assignments', 'assignments.soldier'],
    });
    if (!shift) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
    return shift;
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.findOne(id);
    const { assignments, ...shiftData } = updateShiftDto;

    // Update shift data
    Object.assign(shift, shiftData);
    await this.shiftsRepository.save(shift);

    // Update assignments if provided
    if (assignments !== undefined) {
      // Remove old assignments
      await this.assignmentsRepository.delete({ shiftId: id });

      // Add new assignments
      if (assignments.length > 0) {
        const shiftAssignments = assignments.map(assignment =>
          this.assignmentsRepository.create({
            shiftId: id,
            ...assignment,
          })
        );
        await this.assignmentsRepository.save(shiftAssignments);
      }
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.shiftsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
  }
}
