import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadSource } from './entities/lead-source.entity';
import { LeadStatus } from './entities/lead-status.entity';
import { OpportunityStage } from './entities/opportunity-stage.entity';
import { OpportunityLossReason } from './entities/opportunity-loss-reason.entity';
import { CommunicationChannel } from './entities/communication-channel.entity';
import { SalesAgent } from './entities/sales-agent.entity';

@Injectable()
export class CrmSeederService implements OnModuleInit {
  private readonly logger = new Logger(CrmSeederService.name);

  constructor(
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
    @InjectRepository(LeadStatus)
    private readonly leadStatusRepo: Repository<LeadStatus>,
    @InjectRepository(OpportunityStage)
    private readonly opportunityStageRepo: Repository<OpportunityStage>,
    @InjectRepository(OpportunityLossReason)
    private readonly opportunityLossReasonRepo: Repository<OpportunityLossReason>,
    @InjectRepository(CommunicationChannel)
    private readonly communicationChannelRepo: Repository<CommunicationChannel>,
    @InjectRepository(SalesAgent)
    private readonly salesAgentRepo: Repository<SalesAgent>,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking for CRM lookup seed data...');
    await this.seedLeadSources();
    await this.seedLeadStatuses();
    await this.seedOpportunityStages();
    await this.seedOpportunityLossReasons();
    await this.seedCommunicationChannels();
    await this.seedSalesAgents();
    this.logger.log('CRM lookup seed check completed.');
  }

  private async seedSalesAgents() {
    const count = await this.salesAgentRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Sales Agents...');
      const agents = [
        { fullName: 'Almaz Belay', employeeCode: 'AGT001', phone: '+251911111111', email: 'almaz.belay@ihsanproperties.com', department: 'Sales', isActive: true, joinedAt: new Date() },
        { fullName: 'Yonas Kebede', employeeCode: 'AGT002', phone: '+251911222222', email: 'yonas.kebede@ihsanproperties.com', department: 'Sales', isActive: true, joinedAt: new Date() },
        { fullName: 'Selamawit Girma', employeeCode: 'AGT003', phone: '+251911333333', email: 'selamawit.girma@ihsanproperties.com', department: 'Marketing', isActive: true, joinedAt: new Date() },
      ];
      await this.salesAgentRepo.save(agents);
      this.logger.log(`Seeded ${agents.length} Sales Agents.`);
    }
  }

  private async seedLeadSources() {
    const defaultSources = [
      { sourceName: 'Facebook', sourceType: 'Social Media', description: 'Leads from Facebook campaigns' },
      { sourceName: 'Telegram', sourceType: 'Social Media', description: 'Inquiries received via Telegram channel/bot' },
      { sourceName: 'Referral', sourceType: 'Offline', description: 'Existing customer recommendations' },
      { sourceName: 'Website', sourceType: 'Digital', description: 'Inquiries via company website portal' },
      { sourceName: 'Walk-in', sourceType: 'Offline', description: 'Unannounced visitors to office' },
      { sourceName: 'Phone Inquiry', sourceType: 'Phone', description: 'Direct incoming phone call inquiries' },
      { sourceName: 'Campaign/Event', sourceType: 'Marketing Event', description: 'Leads from property expos & promotional events' },
      { sourceName: 'Instagram', sourceType: 'Social Media', description: 'Leads from Instagram campaigns' },
      { sourceName: 'Google Ads', sourceType: 'Digital', description: 'Paid Google search traffic' },
      { sourceName: 'Broker', sourceType: 'Agent', description: 'Brought in by third-party commission agents' },
      { sourceName: 'Billboard', sourceType: 'Offline', description: 'Outdoor physical advertisement boards' },
      { sourceName: 'Email Campaign', sourceType: 'Digital', description: 'Monthly newsletters and email blasts' },
    ];

    for (const src of defaultSources) {
      const existing = await this.leadSourceRepo.findOne({
        where: { sourceName: src.sourceName }
      });
      if (!existing) {
        const newSource = this.leadSourceRepo.create(src);
        await this.leadSourceRepo.save(newSource);
        this.logger.log(`Seeded Lead Source: ${src.sourceName}`);
      }
    }
  }

  private async seedLeadStatuses() {
    const count = await this.leadStatusRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Lead Statuses...');
      const statuses = [
        { statusName: 'New', colorCode: '#3b82f6', sortOrder: 1, isClosed: false, isConverted: false },
        { statusName: 'Contacted', colorCode: '#eab308', sortOrder: 2, isClosed: false, isConverted: false },
        { statusName: 'Qualified', colorCode: '#10b981', sortOrder: 3, isClosed: false, isConverted: false },
        { statusName: 'Proposal Sent', colorCode: '#a855f7', sortOrder: 4, isClosed: false, isConverted: false },
        { statusName: 'Converted', colorCode: '#14b8a6', sortOrder: 5, isClosed: true, isConverted: true },
        { statusName: 'Lost', colorCode: '#ef4444', sortOrder: 6, isClosed: true, isConverted: false },
      ];
      await this.leadStatusRepo.save(statuses);
      this.logger.log(`Seeded ${statuses.length} Lead Statuses.`);
    }
  }

  private async seedOpportunityStages() {
    const requiredStages = [
      { stageName: 'New Opportunity', sortOrder: 1, probabilityPercent: 10.0, colorCode: '#3b82f6', isClosed: false },
      { stageName: 'Qualified', sortOrder: 2, probabilityPercent: 25.0, colorCode: '#6366f1', isClosed: false },
      { stageName: 'Property Viewing', sortOrder: 3, probabilityPercent: 40.0, colorCode: '#8b5cf6', isClosed: false },
      { stageName: 'Negotiation', sortOrder: 4, probabilityPercent: 60.0, colorCode: '#eab308', isClosed: false },
      { stageName: 'Reservation', sortOrder: 5, probabilityPercent: 75.0, colorCode: '#ec4899', isClosed: false },
      { stageName: 'Contract Processing', sortOrder: 6, probabilityPercent: 90.0, colorCode: '#14b8a6', isClosed: false },
      { stageName: 'Won', sortOrder: 7, probabilityPercent: 100.0, colorCode: '#10b981', isClosed: true },
      { stageName: 'Lost', sortOrder: 8, probabilityPercent: 0.0, colorCode: '#ef4444', isClosed: true },
    ];

    for (const stageData of requiredStages) {
      const existing = await this.opportunityStageRepo.findOne({
        where: [{ stageName: stageData.stageName }, { sortOrder: stageData.sortOrder }],
      });
      if (!existing) {
        await this.opportunityStageRepo.save(stageData);
      }
    }
  }

  private async seedOpportunityLossReasons() {
    const count = await this.opportunityLossReasonRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Opportunity Loss Reasons...');
      const reasons = [
        { reasonName: 'Budget/Price too high', description: 'Client feels the unit price is beyond their financial capacity', isActive: true },
        { reasonName: 'Location preference mismatch', description: 'Client prefers a different sub-city/development area', isActive: true },
        { reasonName: 'Property size/layout mismatch', description: 'Client requires different dimensions, bedrooms, or structural layouts', isActive: true },
        { reasonName: 'Competitor offer chosen', description: 'Client selected a property from alternative developers', isActive: true },
        { reasonName: 'Customer unresponsive', description: 'Client did not respond to multiple callback attempts or proposals', isActive: true },
        { reasonName: 'Project/Construction delay', description: 'Client dissatisfied with projected completion dates', isActive: true },
      ];
      await this.opportunityLossReasonRepo.save(reasons);
      this.logger.log(`Seeded ${reasons.length} Opportunity Loss Reasons.`);
    }
  }

  private async seedCommunicationChannels() {
    const count = await this.communicationChannelRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Communication Channels...');
      const channels = [
        { channelName: 'Phone Call', description: 'Voice communication over mobile or landline networks', isActive: true },
        { channelName: 'Email', description: 'Official written electronic mail correspondence', isActive: true },
        { channelName: 'SMS', description: 'Short Message Service mobile texts', isActive: true },
        { channelName: 'WhatsApp', description: 'Instant messaging chat or call logs via WhatsApp Business', isActive: true },
        { channelName: 'In-Person Meeting', description: 'Face-to-face discussions at offices or on-site tours', isActive: true },
        { channelName: 'Video Conference', description: 'Remote virtual meetings via Teams, Zoom, or Google Meet', isActive: true },
      ];
      await this.communicationChannelRepo.save(channels);
      this.logger.log(`Seeded ${channels.length} Communication Channels.`);
    }
  }
}

