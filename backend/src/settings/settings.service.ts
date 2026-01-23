import { Injectable, NotFoundException } from '@nestjs/common';
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
      });
      return this.settingsRepository.save(defaultSettings);
    }

    return settings[0];
  }

  async update(updateSettingsDto: UpdateSettingsDto): Promise<Settings> {
    const settings = await this.get();
    await this.settingsRepository.update(settings.id, updateSettingsDto);
    return this.get();
  }
}
