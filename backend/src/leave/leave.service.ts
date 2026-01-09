import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRecord } from './entities/leave-record.entity';
import { CreateLeaveRecordDto } from './dto/create-leave-record.dto';
import { UpdateLeaveRecordDto } from './dto/update-leave-record.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveRecord)
    private leaveRepository: Repository<LeaveRecord>,
  ) {}

  async create(createLeaveRecordDto: CreateLeaveRecordDto): Promise<LeaveRecord> {
    const leaveRecord = this.leaveRepository.create(createLeaveRecordDto);
    return this.leaveRepository.save(leaveRecord);
  }

  async findAll(): Promise<LeaveRecord[]> {
    return this.leaveRepository.find({
      relations: ['soldier', 'enteredByUser'],
      order: { startDate: 'DESC' },
    });
  }

  async findBySoldier(soldierId: string): Promise<LeaveRecord[]> {
    return this.leaveRepository.find({
      where: { soldierId },
      relations: ['soldier', 'enteredByUser'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LeaveRecord> {
    const leaveRecord = await this.leaveRepository.findOne({
      where: { id },
      relations: ['soldier', 'enteredByUser'],
    });
    if (!leaveRecord) {
      throw new NotFoundException(`Leave record with ID ${id} not found`);
    }
    return leaveRecord;
  }

  async update(id: string, updateLeaveRecordDto: UpdateLeaveRecordDto): Promise<LeaveRecord> {
    const leaveRecord = await this.findOne(id);
    Object.assign(leaveRecord, updateLeaveRecordDto);
    return this.leaveRepository.save(leaveRecord);
  }

  async remove(id: string): Promise<void> {
    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Leave record with ID ${id} not found`);
    }
  }
}
