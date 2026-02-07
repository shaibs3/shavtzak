import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    private settingsService: SettingsService,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<Assignment> {
    await this.validateOperationalPeriod(
      new Date(createAssignmentDto.startTime),
      new Date(createAssignmentDto.endTime),
    );
    const assignment = this.assignmentsRepository.create(createAssignmentDto);
    return this.assignmentsRepository.save(assignment);
  }

  async findAll(): Promise<Assignment[]> {
    const settings = await this.settingsService.get();
    const query = this.assignmentsRepository.createQueryBuilder('assignment');

    // Filter by operational period if set
    if (settings.operationalStartDate) {
      query.andWhere('assignment.startTime >= :startDate', {
        startDate: settings.operationalStartDate,
      });
    }

    if (settings.operationalEndDate) {
      // For end date, include the entire day by setting time to end of day
      const endOfDay = new Date(settings.operationalEndDate);
      endOfDay.setHours(23, 59, 59, 999);

      query.andWhere('assignment.endTime <= :endDate', {
        endDate: endOfDay,
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Assignment> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    await this.findOne(id); // Check if exists

    // Validate operational period if dates are being updated
    if (updateAssignmentDto.startTime || updateAssignmentDto.endTime) {
      const existing = await this.findOne(id);
      const newStartTime = updateAssignmentDto.startTime
        ? new Date(updateAssignmentDto.startTime)
        : existing.startTime;
      const newEndTime = updateAssignmentDto.endTime
        ? new Date(updateAssignmentDto.endTime)
        : existing.endTime;
      await this.validateOperationalPeriod(newStartTime, newEndTime);
    }

    await this.assignmentsRepository.update(id, updateAssignmentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentsRepository.remove(assignment);
  }

  private async validateOperationalPeriod(
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const settings = await this.settingsService.get();

    // If no operational period is set, allow all assignments
    if (!settings.operationalStartDate || !settings.operationalEndDate) {
      return;
    }

    const operationalStart = new Date(settings.operationalStartDate);
    const operationalEnd = new Date(settings.operationalEndDate);
    // Include the entire end day
    operationalEnd.setHours(23, 59, 59, 999);

    const assignmentStart = new Date(startTime);
    const assignmentEnd = new Date(endTime);

    // Check if assignment is completely within operational period
    if (assignmentStart < operationalStart || assignmentEnd > operationalEnd) {
      throw new BadRequestException(
        `Assignment must be within the operational period (${settings.operationalStartDate} to ${settings.operationalEndDate})`,
      );
    }
  }
}
