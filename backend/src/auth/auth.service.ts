import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, GoogleProfile } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    let user = await this.usersService.findByGoogleId(profile.id);
    if (!user) {
      user = await this.usersService.createFromGoogle(profile);
    }
    return user;
  }

  generateJwt(user: User): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  async createTestUser(): Promise<string> {
    const testProfile: GoogleProfile = {
      id: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    let user = await this.usersService.findByGoogleId(testProfile.id);
    if (!user) {
      user = await this.usersService.createFromGoogle(testProfile);
    }

    return this.generateJwt(user);
  }
}
