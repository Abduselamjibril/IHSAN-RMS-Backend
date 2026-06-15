import { Controller, Get, Post, Put, Body, Param, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { LeadService } from '../services/lead-service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { AddActivityDto } from '../dto/add-activity.dto';

@ApiTags('CRM')
@Controller('api/leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.leadService.findAll(query);
  }

  @Get('stats')
  async getStats() {
    return this.leadService.getStats();
  }

  @Get('export')
  async exportCsv(@Query() query: any, @Res() res: Response) {
    const csvContent = await this.leadService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.status(200).send(csvContent);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.leadService.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.update(+id, updateLeadDto);
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body('agentId') agentId: number) {
    return this.leadService.assignAgent(+id, agentId);
  }

  @Post(':id/status')
  async changeStatus(@Param('id') id: string, @Body('statusId') statusId: number) {
    return this.leadService.changeStatus(+id, statusId);
  }

  @Post(':id/activity')
  async addActivity(@Param('id') id: string, @Body() addActivityDto: AddActivityDto) {
    return this.leadService.addActivity(+id, addActivityDto);
  }

  @Get(':id/contacts')
  async getContacts(@Param('id') id: string) {
    return this.leadService.getContacts(+id);
  }

  @Post(':id/contacts')
  async addContact(@Param('id') id: string, @Body() body: any) {
    return this.leadService.addContact(+id, body);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadAttachment(@Param('id') id: string, @UploadedFile() file: any) {
    return this.leadService.addAttachment(+id, file);
  }

  @Get(':id/attachments')
  async getAttachments(@Param('id') id: string) {
    return this.leadService.getAttachments(+id);
  }
}
