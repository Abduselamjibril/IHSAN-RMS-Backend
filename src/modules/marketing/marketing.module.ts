import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// CRM entities referenced
import { Lead } from '../crm/entities/lead.entity';
import { LeadSource } from '../crm/entities/lead-source.entity';
import { Customer } from '../crm/entities/customer.entity';

// Sales entities referenced
import { SalesBooking } from '../sales/entities/sales-booking.entity';

// Marketing entities
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import { CampaignBudget } from './entities/campaign-budget.entity';
import { CampaignLeadSource } from './entities/campaign-lead-source.entity';
import { MarketingLead } from './entities/marketing-lead.entity';
import { Advertisement } from './entities/advertisement.entity';
import { AdvertisementExpense } from './entities/advertisement-expense.entity';
import { AdvertisementPerformance } from './entities/advertisement-performance.entity';
import { MarketingKpi } from './entities/marketing-kpi.entity';
import { CampaignSummary } from './entities/campaign-summary.entity';
import { MarketingNotificationConfig } from './entities/marketing-notification-config.entity';
import { MarketingNotificationLog } from './entities/marketing-notification-log.entity';
import { CampaignDocument } from './entities/campaign-document.entity';

// View entities
import { CampaignPerformanceView } from './entities/views/campaign-performance-view.entity';
import { LeadSourceAnalysisView } from './entities/views/lead-source-analysis-view.entity';

// Service & Controller
import { MarketingService } from './services/marketing.service';
import { MarketingController } from './controllers/marketing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      LeadSource,
      Customer,
      SalesBooking,

      MarketingCampaign,
      CampaignBudget,
      CampaignLeadSource,
      MarketingLead,
      Advertisement,
      AdvertisementExpense,
      AdvertisementPerformance,
      MarketingKpi,
      CampaignSummary,
      MarketingNotificationConfig,
      MarketingNotificationLog,
      CampaignDocument,

      CampaignPerformanceView,
      LeadSourceAnalysisView,
    ]),
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [TypeOrmModule, MarketingService],
})
export class MarketingModule {}
