import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platoon } from './entities/platoon.entity';
import { CreatePlatoonDto } from './dto/create-platoon.dto';
import { UpdatePlatoonDto } from './dto/update-platoon.dto';

// 10-color palette for platoons
const PLATOON_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#A855F7', // Purple
];

@Injectable()
export class PlatoonsService {
  constructor(
    @InjectRepository(Platoon)
    private platoonsRepository: Repository<Platoon>,
  ) {}

  /**
   * Automatically assigns a color from the palette
   * Colors are assigned in order, cycling through the palette
   */
  private async getNextColor(): Promise<string> {
    const platoons = await this.platoonsRepository.find({
      order: { createdAt: 'ASC' },
    });
    const colorIndex = platoons.length % PLATOON_COLORS.length;
    return PLATOON_COLORS[colorIndex];
  }

  async create(createPlatoonDto: CreatePlatoonDto): Promise<Platoon> {
    const color = await this.getNextColor();
    const platoon = this.platoonsRepository.create({
      ...createPlatoonDto,
      color,
    });
    return this.platoonsRepository.save(platoon);
  }

  async findAll(): Promise<Platoon[]> {
    return this.platoonsRepository.find({
      relations: ['soldiers'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Platoon> {
    const platoon = await this.platoonsRepository.findOne({
      where: { id },
      relations: ['soldiers'],
    });
    if (!platoon) {
      throw new NotFoundException(`Platoon with ID ${id} not found`);
    }
    return platoon;
  }

  async update(
    id: string,
    updatePlatoonDto: UpdatePlatoonDto,
  ): Promise<Platoon> {
    await this.findOne(id); // Check if exists
    await this.platoonsRepository.update(id, updatePlatoonDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const platoon = await this.findOne(id);

    // Check if platoon has assigned soldiers
    if (platoon.soldiers && platoon.soldiers.length > 0) {
      throw new ConflictException(
        `Cannot delete platoon "${platoon.name}" because it has ${platoon.soldiers.length} assigned soldier(s). Please reassign or remove soldiers first.`,
      );
    }

    await this.platoonsRepository.remove(platoon);
  }
}
