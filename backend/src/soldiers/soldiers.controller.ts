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
import { SoldiersService } from './soldiers.service';
import { CreateSoldierDto } from './dto/create-soldier.dto';
import { UpdateSoldierDto } from './dto/update-soldier.dto';
import { CreateConstraintDto } from './dto/create-constraint.dto';
import { BulkUpdateSoldiersDto } from './dto/bulk-update-soldiers.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('soldiers')
@Controller('soldiers')
export class SoldiersController {
  constructor(private readonly soldiersService: SoldiersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new soldier' })
  @ApiResponse({ status: 201, description: 'Soldier created successfully' })
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

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update soldier' })
  @ApiResponse({ status: 200, description: 'Soldier updated successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  update(@Param('id') id: string, @Body() updateSoldierDto: UpdateSoldierDto) {
    return this.soldiersService.update(id, updateSoldierDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete soldier' })
  @ApiResponse({ status: 204, description: 'Soldier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  remove(@Param('id') id: string) {
    return this.soldiersService.remove(id);
  }

  @Post(':id/constraints')
  @Roles('admin')
  @ApiOperation({ summary: 'Add constraint to soldier' })
  @ApiResponse({ status: 201, description: 'Constraint added successfully' })
  @ApiResponse({ status: 404, description: 'Soldier not found' })
  addConstraint(
    @Param('id') id: string,
    @Body() createConstraintDto: CreateConstraintDto,
  ) {
    return this.soldiersService.addConstraint(id, createConstraintDto);
  }

  @Delete(':id/constraints/:constraintId')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove constraint from soldier' })
  @ApiResponse({ status: 204, description: 'Constraint removed successfully' })
  @ApiResponse({ status: 404, description: 'Soldier or constraint not found' })
  removeConstraint(
    @Param('id') id: string,
    @Param('constraintId') constraintId: string,
  ) {
    return this.soldiersService.removeConstraint(id, constraintId);
  }

  @Patch('bulk-update')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk update soldiers platoon assignment' })
  @ApiResponse({ status: 200, description: 'Soldiers updated successfully' })
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSoldiersDto) {
    return this.soldiersService.bulkUpdate(
      bulkUpdateDto.soldierIds,
      bulkUpdateDto.platoonId ?? null
    );
  }
}
