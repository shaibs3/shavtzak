import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ValidationService } from '../validation/validation.service';
import { ViolationSeverity } from '../validation/interfaces/constraint-violation.interface';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private shiftsRepository: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private assignmentsRepository: Repository<ShiftAssignment>,
    private validationService: ValidationService,
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const { assignments, ...shiftData } = createShiftDto;

    // Validate shift before creating
    const validationResult = await this.validationService.validateShift({
      taskId: createShiftDto.taskId,
      startTime: new Date(createShiftDto.startTime),
      endTime: new Date(createShiftDto.endTime),
      assignments: assignments || [],
    });

    // Check for errors (warnings are allowed)
    const errors = validationResult.violations.filter(
      v => v.severity === ViolationSeverity.ERROR
    );

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Shift validation failed',
        errors: errors.map(e => e.message),
        warnings: validationResult.violations
          .filter(v => v.severity === ViolationSeverity.WARNING)
          .map(w => w.message),
      });
    }

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

    // Return shift with warnings if any
    const result = await this.findOne(savedShift.id);

    const warnings = validationResult.violations.filter(
      v => v.severity === ViolationSeverity.WARNING
    );

    return {
      ...result,
      ...(warnings.length > 0 && { warnings: warnings.map(w => w.message) }),
    } as any;
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

    // Prepare data for validation (use updated values or existing values)
    const updatedAssignments = assignments !== undefined
      ? assignments
      : shift.assignments.map(a => ({
          soldierId: a.soldierId,
          role: a.role
        }));

    // Validate shift before updating
    const validationResult = await this.validationService.validateShift({
      taskId: updateShiftDto.taskId ?? shift.taskId,
      startTime: updateShiftDto.startTime ? new Date(updateShiftDto.startTime) : shift.startTime,
      endTime: updateShiftDto.endTime ? new Date(updateShiftDto.endTime) : shift.endTime,
      assignments: updatedAssignments,
      shiftId: id, // Include shiftId to exclude current shift from overlap checks
    });

    // Check for errors (warnings are allowed)
    const errors = validationResult.violations.filter(
      v => v.severity === ViolationSeverity.ERROR
    );

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Shift validation failed',
        errors: errors.map(e => e.message),
        warnings: validationResult.violations
          .filter(v => v.severity === ViolationSeverity.WARNING)
          .map(w => w.message),
      });
    }

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

    // Return shift with warnings if any
    const result = await this.findOne(id);

    const warnings = validationResult.violations.filter(
      v => v.severity === ViolationSeverity.WARNING
    );

    return {
      ...result,
      ...(warnings.length > 0 && { warnings: warnings.map(w => w.message) }),
    } as any;
  }

  async remove(id: string): Promise<void> {
    const result = await this.shiftsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shift with ID ${id} not found`);
    }
  }
}
