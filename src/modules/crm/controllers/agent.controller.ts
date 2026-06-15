import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesAgent } from '../entities/sales-agent.entity';
import { LeadSource } from '../entities/lead-source.entity';
import { LeadStatus } from '../entities/lead-status.entity';
import { NotificationService } from '../services/notification.service';

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
  async getAgents() {
    return this.salesAgentRepo.find({ where: { isActive: true }, order: { fullName: 'ASC' } });
  }

  @Get('metadata')
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
  async getReminders() {
    return this.notificationService.getReminders();
  }
}
