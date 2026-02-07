import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PlatoonsService } from './platoons.service';
import { CreatePlatoonDto } from './dto/create-platoon.dto';
import { UpdatePlatoonDto } from './dto/update-platoon.dto';
import { AutoAssignDto } from './dto/auto-assign.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('platoons')
@Controller('platoons')
export class PlatoonsController {
  constructor(private readonly platoonsService: PlatoonsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new platoon' })
  @ApiResponse({ status: 201, description: 'Platoon created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createPlatoonDto: CreatePlatoonDto) {
    return this.platoonsService.create(createPlatoonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all platoons' })
  @ApiResponse({ status: 200, description: 'List of all platoons' })
  findAll() {
    return this.platoonsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get platoon by ID' })
  @ApiResponse({ status: 200, description: 'Platoon found' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  findOne(@Param('id') id: string) {
    return this.platoonsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update platoon' })
  @ApiResponse({ status: 200, description: 'Platoon updated successfully' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  update(@Param('id') id: string, @Body() updatePlatoonDto: UpdatePlatoonDto) {
    return this.platoonsService.update(id, updatePlatoonDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete platoon' })
  @ApiResponse({ status: 204, description: 'Platoon deleted successfully' })
  @ApiResponse({ status: 404, description: 'Platoon not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete platoon with assigned soldiers',
  })
  remove(@Param('id') id: string) {
    return this.platoonsService.remove(id);
  }

  @Post('auto-assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Auto-assign soldiers without platoon' })
  @ApiResponse({ status: 200, description: 'Soldiers assigned successfully' })
  autoAssign(@Body() autoAssignDto: AutoAssignDto) {
    return this.platoonsService.autoAssign(autoAssignDto.platoonIds);
  }
}
