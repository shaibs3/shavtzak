import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { TaskRole } from './entities/task-role.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskRole)
    private taskRolesRepository: Repository<TaskRole>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { requiredRoles, ...taskData } = createTaskDto;

    const task = this.tasksRepository.create(taskData);
    const savedTask = await this.tasksRepository.save(task);

    const roles = requiredRoles.map((roleDto) =>
      this.taskRolesRepository.create({
        ...roleDto,
        task: savedTask,
      }),
    );

    await this.taskRolesRepository.save(roles);

    return this.findOne(savedTask.id);
  }

  async findAll(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    const { requiredRoles, ...taskData } = updateTaskDto;

    if (Object.keys(taskData).length > 0) {
      await this.tasksRepository.update(id, taskData);
    }

    if (requiredRoles) {
      // Delete existing roles
      await this.taskRolesRepository.delete({ task: { id } });

      // Create new roles
      const roles = requiredRoles.map((roleDto) =>
        this.taskRolesRepository.create({
          ...roleDto,
          task,
        }),
      );
      await this.taskRolesRepository.save(roles);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
