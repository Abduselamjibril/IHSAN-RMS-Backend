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
    const requiredStatuses = [
      { statusName: 'New', colorCode: '#64748b', sortOrder: 1, isClosed: false, isConverted: false },
      { statusName: 'Contacted', colorCode: '#3b82f6', sortOrder: 2, isClosed: false, isConverted: false },
      { statusName: 'Interested', colorCode: '#8b5cf6', sortOrder: 3, isClosed: false, isConverted: false },
      { statusName: 'Site Visit Scheduled', colorCode: '#f59e0b', sortOrder: 4, isClosed: false, isConverted: false },
      { statusName: 'Negotiation', colorCode: '#ec4899', sortOrder: 5, isClosed: false, isConverted: false },
      { statusName: 'Qualified', colorCode: '#06b6d4', sortOrder: 6, isClosed: false, isConverted: false },
      { statusName: 'Proposal Sent', colorCode: '#a855f7', sortOrder: 7, isClosed: false, isConverted: false },
      { statusName: 'Converted', colorCode: '#22c55e', sortOrder: 8, isClosed: true, isConverted: true },
      { statusName: 'Lost', colorCode: '#ef4444', sortOrder: 9, isClosed: true, isConverted: false },
    ];

    for (const st of requiredStatuses) {
      let existing = await this.leadStatusRepo.findOne({ where: { statusName: st.statusName } });
      if (!existing) {
        existing = this.leadStatusRepo.create(st);
      } else {
        existing.colorCode = st.colorCode;
        existing.sortOrder = st.sortOrder;
        existing.isClosed = st.isClosed;
        existing.isConverted = st.isConverted;
      }
      await this.leadStatusRepo.save(existing);
    }
    this.logger.log(`Seeded / Synced ${requiredStatuses.length} Lead Statuses.`);
  }

  private async seedOpportunityStages() {
    const requiredStages = [
      { stageName: 'New Opportunity', sortOrder: 1, probabilityPercent: 10.0, colorCode: '#3b82f6', isClosed: false },
      { stageName: 'Qualification', sortOrder: 2, probabilityPercent: 25.0, colorCode: '#06b6d4', isClosed: false },
      { stageName: 'Property Viewing', sortOrder: 3, probabilityPercent: 40.0, colorCode: '#8b5cf6', isClosed: false },
      { stageName: 'Needs Analysis', sortOrder: 4, probabilityPercent: 50.0, colorCode: '#f59e0b', isClosed: false },
      { stageName: 'Proposal/Price Quote', sortOrder: 5, probabilityPercent: 70.0, colorCode: '#a855f7', isClosed: false },
      { stageName: 'Negotiation', sortOrder: 6, probabilityPercent: 85.0, colorCode: '#ec4899', isClosed: false },
      { stageName: 'Closed Won', sortOrder: 7, probabilityPercent: 100.0, colorCode: '#22c55e', isClosed: true },
      { stageName: 'Closed Lost', sortOrder: 8, probabilityPercent: 0.0, colorCode: '#ef4444', isClosed: true },
    ];

    for (const stageData of requiredStages) {
      let existing = await this.opportunityStageRepo.findOne({
        where: { stageName: stageData.stageName },
      });
      if (!existing) {
        existing = this.opportunityStageRepo.create(stageData);
      } else {
        existing.sortOrder = stageData.sortOrder;
        existing.probabilityPercent = stageData.probabilityPercent;
        existing.colorCode = stageData.colorCode;
        existing.isClosed = stageData.isClosed;
      }
      await this.opportunityStageRepo.save(existing);
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

