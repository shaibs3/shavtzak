import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deployment } from './entities/deployment.entity';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';

@Injectable()
export class DeploymentService {
  constructor(
    @InjectRepository(Deployment)
    private deploymentRepository: Repository<Deployment>,
  ) {}

  async create(createDeploymentDto: CreateDeploymentDto): Promise<Deployment> {
    const deployment = this.deploymentRepository.create(createDeploymentDto);
    return this.deploymentRepository.save(deployment);
  }

  async findAll(): Promise<Deployment[]> {
    return this.deploymentRepository.find({
      order: { startDate: 'DESC' },
    });
  }

  async findActive(): Promise<Deployment[]> {
    return this.deploymentRepository.find({
      where: { isActive: true },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Deployment> {
    const deployment = await this.deploymentRepository.findOne({ where: { id } });
    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }
    return deployment;
  }

  async update(id: string, updateDeploymentDto: UpdateDeploymentDto): Promise<Deployment> {
    const deployment = await this.findOne(id);
    Object.assign(deployment, updateDeploymentDto);
    return this.deploymentRepository.save(deployment);
  }

  async remove(id: string): Promise<void> {
    const result = await this.deploymentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }
  }
}
