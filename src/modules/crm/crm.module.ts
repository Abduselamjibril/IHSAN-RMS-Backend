import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadSource } from './entities/lead-source.entity';
import { LeadStatus } from './entities/lead-status.entity';
import { SalesAgent } from './entities/sales-agent.entity';
import { Lead } from './entities/lead.entity';
import { LeadContact } from './entities/lead-contact.entity';
import { Customer } from './entities/customer.entity';
import { LeadNote } from './entities/lead-note.entity';
import { LeadActivity } from './entities/lead-activity.entity';
import { OpportunityStage } from './entities/opportunity-stage.entity';
import { OpportunityLossReason } from './entities/opportunity-loss-reason.entity';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunityActivity } from './entities/opportunity-activity.entity';
import { OpportunityNote } from './entities/opportunity-note.entity';
import { OpportunityForecast } from './entities/opportunity-forecast.entity';
import { OpportunityProperty } from './entities/opportunity-property.entity';
import { FollowupReminder } from './entities/followup-reminder.entity';
import { FollowupHistory } from './entities/followup-history.entity';
import { FollowupNotification } from './entities/followup-notification.entity';
import { CommunicationChannel } from './entities/communication-channel.entity';
import { Communication } from './entities/communication.entity';
import { CommunicationAttachment } from './entities/communication-attachment.entity';
import { CommunicationAudit } from './entities/communication-audit.entity';
import { CrmSeederService } from './crm-seeder.service';
import { LeadService } from './services/lead-service';
import { NotificationService } from './services/notification.service';
import { EmailService } from './services/email.service';
import { OpportunityService } from './services/opportunity.service';
import { LeadController } from './controllers/lead.controller';
import { AgentController } from './controllers/agent.controller';
import { LeadSourceController } from './controllers/lead-source.controller';
import { OpportunityController } from './controllers/opportunity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeadSource,
      LeadStatus,
      SalesAgent,
      Lead,
      LeadContact,
      Customer,
      LeadNote,
      LeadActivity,
      OpportunityStage,
      OpportunityLossReason,
      Opportunity,
      OpportunityActivity,
      OpportunityNote,
      OpportunityForecast,
      OpportunityProperty,
      FollowupReminder,
      FollowupHistory,
      FollowupNotification,
      CommunicationChannel,
      Communication,
      CommunicationAttachment,
      CommunicationAudit,
    ]),
  ],
  controllers: [LeadController, AgentController, LeadSourceController, OpportunityController],
  providers: [CrmSeederService, LeadService, NotificationService, EmailService, OpportunityService],
  exports: [TypeOrmModule, LeadService, NotificationService, EmailService, OpportunityService],
})
export class CrmModule {}
