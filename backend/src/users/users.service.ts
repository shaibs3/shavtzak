import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

export interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createFromGoogle(profile: GoogleProfile): Promise<User> {
    // Check if this is the first user - make them admin
    const userCount = await this.usersRepository.count();
    const role: UserRole = userCount === 0 ? 'admin' : 'viewer';

    const user = this.usersRepository.create({
      googleId: profile.id,
      email: profile.email,
      name: profile.displayName,
      picture: profile.picture,
      role,
    });

    return this.usersRepository.save(user);
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }

  async countAdmins(): Promise<number> {
    return this.usersRepository.count({ where: { role: 'admin' } });
  }
}
