import { Controller, Get, Post, Put, Body, Param, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { LeadService } from '../services/lead-service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { AddActivityDto } from '../dto/add-activity.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiConsumes } from '@nestjs/swagger';

@ApiTags('leads')
@Controller('api/leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({ status: 201, description: 'Lead successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads with optional filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for lead name or phone' })
  @ApiQuery({ name: 'statusId', required: false, type: Number, description: 'Filter by lead status ID' })
  @ApiQuery({ name: 'sourceId', required: false, type: Number, description: 'Filter by lead source ID' })
  @ApiQuery({ name: 'agentId', required: false, type: Number, description: 'Filter by assigned agent ID' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by creation start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by creation end date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'List of leads matching criteria' })
  async findAll(@Query() query: any) {
    return this.leadService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics dashboard summary' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics (total, statuses, sources)' })
  async getStats() {
    return this.leadService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export leads list to CSV format' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'statusId', required: false, type: Number })
  @ApiQuery({ name: 'sourceId', required: false, type: Number })
  @ApiQuery({ name: 'agentId', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'CSV file containing leads metadata' })
  async exportCsv(@Query() query: any, @Res() res: Response) {
    const csvContent = await this.leadService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads-export.csv');
    res.status(200).send(csvContent);
  }

  @Get('notes/all')
  @ApiOperation({ summary: 'Get all internal notes across all leads' })
  async findAllNotes(@Query() query: any) {
    return this.leadService.findAllNotes(query);
  }

  @Get('attachments/all')
  @ApiOperation({ summary: 'Get all lead attachments/documents' })
  async findAllAttachments(@Query() query: any) {
    return this.leadService.findAllAttachments(query);
  }

  @Get('activities/all')
  @ApiOperation({ summary: 'Get all lead activities/interactions' })
  async findAllActivities(@Query() query: any) {
    return this.leadService.findAllActivities(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'The lead details including activities, contacts, and attachments' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(@Param('id') id: string) {
    return this.leadService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({ status: 200, description: 'Lead successfully updated' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.update(+id, updateLeadDto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a lead to a sales agent' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        agentId: { type: 'number', example: 1, description: 'Sales agent ID' },
      },
      required: ['agentId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lead successfully assigned' })
  @ApiResponse({ status: 404, description: 'Lead or agent not found' })
  async assign(@Param('id') id: string, @Body('agentId') agentId: number) {
    return this.leadService.assignAgent(+id, agentId);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Change the status of a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        statusId: { type: 'number', example: 2, description: 'Lead status ID' },
      },
      required: ['statusId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Lead status successfully updated' })
  @ApiResponse({ status: 404, description: 'Lead or status not found' })
  async changeStatus(@Param('id') id: string, @Body('statusId') statusId: number) {
    return this.leadService.changeStatus(+id, statusId);
  }

  @Post(':id/activity')
  @ApiOperation({ summary: 'Add a new activity log / interaction to a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({ type: AddActivityDto })
  @ApiResponse({ status: 201, description: 'Activity successfully logged' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async addActivity(@Param('id') id: string, @Body() addActivityDto: AddActivityDto) {
    return this.leadService.addActivity(+id, addActivityDto);
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Get all additional contacts for a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'List of additional contacts' })
  async getContacts(@Param('id') id: string) {
    return this.leadService.getContacts(+id);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add a new contact to a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contactName: { type: 'string', example: 'Abebe Kebede' },
        relationshipType: { type: 'string', example: 'Partner' },
        phone: { type: 'string', example: '+251911234567' },
        email: { type: 'string', example: 'abebe@example.com' },
        isPrimary: { type: 'boolean', example: false },
        notes: { type: 'string', example: 'Secondary contact for site visits' },
      },
      required: ['contactName', 'relationshipType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Contact successfully added' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async addContact(@Param('id') id: string, @Body() body: any) {
    return this.leadService.addContact(+id, body);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload a file attachment for a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document or image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  @ApiResponse({ status: 201, description: 'File successfully uploaded and attached to lead' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async uploadAttachment(@Param('id') id: string, @UploadedFile() file: any) {
    return this.leadService.addAttachment(+id, file);
  }

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get all file attachments for a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'List of lead attachments' })
  async getAttachments(@Param('id') id: string) {
    return this.leadService.getAttachments(+id);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a new internal note to a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        note: { type: 'string', example: 'Followed up with client, requested site visit.', description: 'Note content' },
      },
      required: ['note'],
    },
  })
  @ApiResponse({ status: 201, description: 'Note successfully added' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async addNote(@Param('id') id: string, @Body('note') noteContent: string) {
    return this.leadService.addNote(+id, noteContent);
  }
}

