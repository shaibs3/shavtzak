import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() currentUser: User,
  ) {
    // Prevent admin from demoting themselves if they're the last admin
    if (id === currentUser.id && dto.role === 'viewer') {
      const adminCount = await this.usersService.countAdmins();
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin');
      }
    }
    return this.usersService.updateRole(id, dto.role);
  }
}
