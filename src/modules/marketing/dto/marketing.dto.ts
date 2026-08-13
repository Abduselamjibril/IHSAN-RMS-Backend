import { AllowProperties } from '../../../common/validation/dto-whitelist';

@AllowProperties('campaignCode', 'campaignName', 'campaignType', 'campaignObjective', 'startDate', 'endDate', 'budgetAmount', 'targetAudience', 'campaignStatus')
export class CreateCampaignDto {
  campaignCode: string;
  campaignName: string;
  campaignType: string;
  campaignObjective?: string;
  startDate: string;
  endDate?: string;
  budgetAmount?: number;
  targetAudience?: string;
  campaignStatus?: string;
}

@AllowProperties('campaignCode', 'campaignName', 'campaignType', 'campaignObjective', 'startDate', 'endDate', 'budgetAmount', 'targetAudience', 'campaignStatus')
export class UpdateCampaignDto {
  campaignCode?: string;
  campaignName?: string;
  campaignType?: string;
  campaignObjective?: string;
  startDate?: string;
  endDate?: string;
  budgetAmount?: number;
  targetAudience?: string;
  campaignStatus?: string;
}

@AllowProperties('campaignId', 'advertisementCode', 'advertisementTitle', 'advertisementChannel', 'advertisementContent', 'startDate', 'endDate', 'plannedBudget', 'advertisementStatus')
export class CreateAdvertisementDto {
  campaignId: number;
  advertisementCode?: string;
  advertisementTitle?: string;
  advertisementChannel?: string;
  advertisementContent?: string;
  startDate?: string;
  endDate?: string;
  plannedBudget?: number;
  advertisementStatus?: string;
}

@AllowProperties('expenseDate', 'expenseType', 'expenseAmount', 'vendorName', 'paymentReference', 'remarks')
export class RecordExpenseDto {
  expenseDate: string;
  expenseType?: string;
  expenseAmount?: number;
  vendorName?: string;
  paymentReference?: string;
  remarks?: string;
}

@AllowProperties('performanceDate', 'impressions', 'clicks', 'inquiries', 'leadsGenerated', 'conversions', 'revenueGenerated')
export class RecordPerformanceDto {
  performanceDate?: string;
  impressions?: number;
  clicks?: number;
  inquiries?: number;
  leadsGenerated?: number;
  conversions?: number;
  revenueGenerated?: number;
}

@AllowProperties('leadId', 'campaignId', 'leadSourceId', 'advertisementId', 'leadScore', 'conversionProbability', 'acquisitionCost')
export class TrackLeadDto {
  leadId: number;
  campaignId?: number;
  leadSourceId?: number;
  advertisementId?: number;
  leadScore?: number;
  conversionProbability?: number;
  acquisitionCost?: number;
}
