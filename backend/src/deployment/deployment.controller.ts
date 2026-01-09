import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { UpdateDeploymentDto } from './dto/update-deployment.dto';

@Controller('api/deployment')
export class DeploymentController {
  constructor(private deploymentService: DeploymentService) {}

  @Post()
  create(@Body() createDeploymentDto: CreateDeploymentDto) {
    return this.deploymentService.create(createDeploymentDto);
  }

  @Get()
  findAll(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.deploymentService.findActive();
    }
    return this.deploymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDeploymentDto: UpdateDeploymentDto) {
    return this.deploymentService.update(id, updateDeploymentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deploymentService.remove(id);
  }
}
