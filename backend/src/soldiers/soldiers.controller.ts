import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SoldiersService } from './soldiers.service';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';

@ApiTags('soldiers')
@Controller('api/soldiers')
export class SoldiersController {
  constructor(private soldiersService: SoldiersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new soldier' })
  @ApiResponse({ status: 201, description: 'Soldier created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createSoldierDto: CreateSoldierDto) {
    return this.soldiersService.create(createSoldierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all soldiers' })
  @ApiResponse({ status: 200, description: 'List of all soldiers' })
  findAll() {
    return this.soldiersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get soldier by ID' })
  @ApiResponse({ status: 200, description: 'Soldier found' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  findOne(@Param('id') id: string) {
    return this.soldiersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update soldier' })
  @ApiResponse({ status: 200, description: 'Soldier updated successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  update(@Param('id') id: string, @Body() updateSoldierDto: UpdateSoldierDto) {
    return this.soldiersService.update(id, updateSoldierDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete soldier' })
  @ApiResponse({ status: 200, description: 'Soldier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  remove(@Param('id') id: string) {
    return this.soldiersService.remove(id);
  }
}
