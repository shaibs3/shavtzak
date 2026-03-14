import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private settingsRepository: Repository<Settings>,
  ) {}

  async get(): Promise<Settings> {
    const settings = await this.settingsRepository.find();

    if (settings.length === 0) {
      // Create default settings if none exist
      const defaultSettings = this.settingsRepository.create({
        minBasePresence: 75,
        totalSoldiers: 20,
        customRoles: null,
      });
      return this.settingsRepository.save(defaultSettings);
    }

    return settings[0];
  }

  async update(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    this.validateOperationalPeriod(updateSettingsDto);
    const settings = await this.get();
    await this.settingsRepository.update(settings.id, updateSettingsDto);
    return this.get();
  }

  private validateOperationalPeriod(dto: UpdateSettingsDto): void {
    const hasStartDate = dto.operationalStartDate !== undefined;
    const hasEndDate = dto.operationalEndDate !== undefined;

    // Both dates must be provided together or neither
    if (hasStartDate !== hasEndDate) {
      throw new BadRequestException(
        'Both operationalStartDate and operationalEndDate must be provided together',
      );
    }

    // If both dates are provided, validate that end date is after start date
    if (hasStartDate && hasEndDate) {
      const startDate = new Date(dto.operationalStartDate!);
      const endDate = new Date(dto.operationalEndDate!);

      if (endDate <= startDate) {
        throw new BadRequestException(
          'operationalEndDate must be after operationalStartDate',
        );
      }
    }
  }
}
