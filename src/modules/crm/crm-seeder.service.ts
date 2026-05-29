import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadSource } from './entities/lead-source.entity';
import { LeadStatus } from './entities/lead-status.entity';
import { OpportunityStage } from './entities/opportunity-stage.entity';
import { OpportunityLossReason } from './entities/opportunity-loss-reason.entity';
import { CommunicationChannel } from './entities/communication-channel.entity';

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
  ) {}

  async onModuleInit() {
    this.logger.log('Checking for CRM lookup seed data...');
    await this.seedLeadSources();
    await this.seedLeadStatuses();
    await this.seedOpportunityStages();
    await this.seedOpportunityLossReasons();
    await this.seedCommunicationChannels();
    this.logger.log('CRM lookup seed check completed.');
  }

  private async seedLeadSources() {
    const count = await this.leadSourceRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Lead Sources...');
      const sources = [
        { sourceName: 'Website', sourceType: 'Digital', description: 'Inquiries via company website portal' },
        { sourceName: 'Facebook', sourceType: 'Social Media', description: 'Leads from Facebook campaigns' },
        { sourceName: 'Instagram', sourceType: 'Social Media', description: 'Leads from Instagram campaigns' },
        { sourceName: 'Google Ads', sourceType: 'Digital', description: 'Paid Google search traffic' },
        { sourceName: 'Referral', sourceType: 'Offline', description: 'Existing customer recommendations' },
        { sourceName: 'Walk-in', sourceType: 'Offline', description: 'Unannounced visitors to head office' },
        { sourceName: 'Broker', sourceType: 'Agent', description: 'Brought in by third-party commission agents' },
        { sourceName: 'Billboard', sourceType: 'Offline', description: 'Outdoor physical advertisement boards' },
        { sourceName: 'Email Campaign', sourceType: 'Digital', description: 'Monthly newsletters and email blasts' },
      ];
      await this.leadSourceRepo.save(sources);
      this.logger.log(`Seeded ${sources.length} Lead Sources.`);
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
    const count = await this.opportunityStageRepo.count();
    if (count === 0) {
      this.logger.log('Seeding CRM Opportunity Stages...');
      const stages = [
        { stageName: 'Qualification', sortOrder: 1, probabilityPercent: 10.0, colorCode: '#3b82f6', isClosed: false },
        { stageName: 'Needs Analysis', sortOrder: 2, probabilityPercent: 20.0, colorCode: '#6366f1', isClosed: false },
        { stageName: 'Proposal/Price Quote', sortOrder: 3, probabilityPercent: 50.0, colorCode: '#a855f7', isClosed: false },
        { stageName: 'Negotiation', sortOrder: 4, probabilityPercent: 80.0, colorCode: '#eab308', isClosed: false },
        { stageName: 'Closed Won', sortOrder: 5, probabilityPercent: 100.0, colorCode: '#10b981', isClosed: true },
        { stageName: 'Closed Lost', sortOrder: 6, probabilityPercent: 0.0, colorCode: '#ef4444', isClosed: true },
      ];
      await this.opportunityStageRepo.save(stages);
      this.logger.log(`Seeded ${stages.length} Opportunity Stages.`);
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
