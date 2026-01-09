import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { CreateLeaveRecordDto } from './dto/create-leave-record.dto';
import { UpdateLeaveRecordDto } from './dto/update-leave-record.dto';

@Controller('api/leave')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Post()
  create(@Body() createLeaveRecordDto: CreateLeaveRecordDto) {
    return this.leaveService.create(createLeaveRecordDto);
  }

  @Get()
  findAll(@Query('soldierId') soldierId?: string) {
    if (soldierId) {
      return this.leaveService.findBySoldier(soldierId);
    }
    return this.leaveService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaveService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLeaveRecordDto: UpdateLeaveRecordDto) {
    return this.leaveService.update(id, updateLeaveRecordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaveService.remove(id);
  }
}
