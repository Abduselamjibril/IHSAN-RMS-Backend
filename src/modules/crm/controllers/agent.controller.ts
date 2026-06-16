import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesAgent } from '../entities/sales-agent.entity';
import { LeadSource } from '../entities/lead-source.entity';
import { LeadStatus } from '../entities/lead-status.entity';
import { NotificationService } from '../services/notification.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateAgentDto, UpdateAgentDto } from '../dto/agent.dto';

@ApiTags('CRM')
@Controller('api/agents')
export class AgentController {
  constructor(
    @InjectRepository(SalesAgent)
    private readonly salesAgentRepo: Repository<SalesAgent>,
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
    @InjectRepository(LeadStatus)
    private readonly leadStatusRepo: Repository<LeadStatus>,
    private readonly notificationService: NotificationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all sales agents (active and inactive)' })
  @ApiResponse({ status: 200, description: 'List of agents' })
  async getAgents() {
    return this.salesAgentRepo.find({ order: { fullName: 'ASC' } });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sales agent' })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({ status: 201, description: 'Agent successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async createAgent(@Body() dto: CreateAgentDto) {
    if (!dto.fullName) {
      throw new BadRequestException('Full name is required');
    }
    const agent = new SalesAgent();
    agent.fullName = dto.fullName;
    agent.employeeCode = dto.employeeCode ?? `AGT-${Date.now()}`;
    agent.phone = dto.phone ?? '';
    agent.email = dto.email ?? '';
    agent.department = dto.department ?? '';
    agent.isActive = dto.isActive !== undefined ? dto.isActive : true;
    agent.joinedAt = dto.joinedAt ?? new Date();

    return this.salesAgentRepo.save(agent);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing sales agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiBody({ type: UpdateAgentDto })
  @ApiResponse({ status: 200, description: 'Agent updated successfully' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async updateAgent(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    const agent = await this.salesAgentRepo.findOne({ where: { id: +id } });
    if (!agent) {
      throw new NotFoundException(`Sales Agent with ID ${id} not found`);
    }

    if (dto.fullName !== undefined) agent.fullName = dto.fullName;
    if (dto.employeeCode !== undefined) agent.employeeCode = dto.employeeCode;
    if (dto.phone !== undefined) agent.phone = dto.phone;
    if (dto.email !== undefined) agent.email = dto.email;
    if (dto.department !== undefined) agent.department = dto.department;
    if (dto.isActive !== undefined) agent.isActive = dto.isActive;
    if (dto.joinedAt !== undefined) agent.joinedAt = dto.joinedAt;

    return this.salesAgentRepo.save(agent);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate / Soft-delete a sales agent' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: 'Agent successfully deactivated' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  async deleteAgent(@Param('id') id: string) {
    const agent = await this.salesAgentRepo.findOne({ where: { id: +id } });
    if (!agent) {
      throw new NotFoundException(`Sales Agent with ID ${id} not found`);
    }
    agent.isActive = false;
    return this.salesAgentRepo.save(agent);
  }

  @Get('metadata')
  @ApiOperation({ summary: 'Get CRM configuration metadata (agents, sources, statuses)' })
  @ApiResponse({ status: 200, description: 'Combined CRM configuration metadata' })
  async getMetadata() {
    const agents = await this.salesAgentRepo.find({ where: { isActive: true }, order: { fullName: 'ASC' } });
    const sources = await this.leadSourceRepo.find({ where: { isActive: true }, order: { sourceName: 'ASC' } });
    const statuses = await this.leadStatusRepo.find({ order: { sortOrder: 'ASC' } });

    return {
      agents,
      sources,
      statuses,
    };
  }

  @Get('reminders')
  @ApiOperation({ summary: 'Get pending followup reminders' })
  @ApiResponse({ status: 200, description: 'List of active reminders' })
  async getReminders() {
    return this.notificationService.getReminders();
  }

  @Put('reminders/:id/complete')
  @ApiOperation({ summary: 'Mark a followup reminder as completed' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder marked completed' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async completeReminder(@Param('id') id: string) {
    try {
      return await this.notificationService.completeReminder(+id);
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  @Put('reminders/:id/snooze')
  @ApiOperation({ summary: 'Snooze a followup reminder by a given number of minutes' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder snoozed successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async snoozeReminder(@Param('id') id: string, @Body('minutes') minutes: number) {
    try {
      return await this.notificationService.snoozeReminder(+id, minutes || 30);
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  @Put('reminders/:id/reschedule')
  @ApiOperation({ summary: 'Reschedule a followup reminder to a new datetime' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({ status: 200, description: 'Reminder rescheduled successfully' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  async rescheduleReminder(@Param('id') id: string, @Body('datetime') datetime: string) {
    try {
      return await this.notificationService.rescheduleReminder(+id, new Date(datetime));
    } catch (err) {
      throw new NotFoundException(err.message);
    }
  }

  @Post('reminders/cron/check-escalations')
  @ApiOperation({ summary: 'Trigger check of overdue reminders to escalate to managers' })
  @ApiResponse({ status: 200, description: 'Overdue reminders check and escalation triggered' })
  async checkEscalations() {
    return this.notificationService.checkEscalations();
  }
}


