import { Injectable, NotFoundException } from '@nestjs/common';
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
    const assignment = await this.assignmentsRepository.findOne({ where: { id } });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto): Promise<Assignment> {
    await this.findOne(id); // Check if exists
    await this.assignmentsRepository.update(id, updateAssignmentDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentsRepository.remove(assignment);
  }
}
