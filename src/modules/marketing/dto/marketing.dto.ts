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

export class RecordExpenseDto {
  expenseDate: string;
  expenseType?: string;
  expenseAmount?: number;
  vendorName?: string;
  paymentReference?: string;
  remarks?: string;
}

export class RecordPerformanceDto {
  performanceDate?: string;
  impressions?: number;
  clicks?: number;
  inquiries?: number;
  leadsGenerated?: number;
  conversions?: number;
  revenueGenerated?: number;
}

export class TrackLeadDto {
  leadId: number;
  campaignId?: number;
  leadSourceId?: number;
  advertisementId?: number;
  leadScore?: number;
  conversionProbability?: number;
  acquisitionCost?: number;
}
