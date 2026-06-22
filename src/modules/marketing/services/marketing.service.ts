import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MarketingCampaign } from '../entities/marketing-campaign.entity';
import { CampaignBudget } from '../entities/campaign-budget.entity';
import { CampaignLeadSource } from '../entities/campaign-lead-source.entity';
import { MarketingLead } from '../entities/marketing-lead.entity';
import { Advertisement } from '../entities/advertisement.entity';
import { AdvertisementExpense } from '../entities/advertisement-expense.entity';
import { AdvertisementPerformance } from '../entities/advertisement-performance.entity';
import { MarketingKpi } from '../entities/marketing-kpi.entity';
import { CampaignSummary } from '../entities/campaign-summary.entity';
import { MarketingNotificationConfig } from '../entities/marketing-notification-config.entity';
import { MarketingNotificationLog } from '../entities/marketing-notification-log.entity';
import { CampaignDocument } from '../entities/campaign-document.entity';

// Views
import { CampaignPerformanceView } from '../entities/views/campaign-performance-view.entity';
import { LeadSourceAnalysisView } from '../entities/views/lead-source-analysis-view.entity';

// CRM / Sales referenced entities
import { Lead } from '../../crm/entities/lead.entity';
import { LeadSource } from '../../crm/entities/lead-source.entity';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesBooking } from '../../sales/entities/sales-booking.entity';

// DTOs
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateAdvertisementDto,
  RecordExpenseDto,
  RecordPerformanceDto,
  TrackLeadDto,
} from '../dto/marketing.dto';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private readonly campaignRepo: Repository<MarketingCampaign>,
    @InjectRepository(CampaignBudget)
    private readonly budgetRepo: Repository<CampaignBudget>,
    @InjectRepository(CampaignLeadSource)
    private readonly campaignLeadSourceRepo: Repository<CampaignLeadSource>,
    @InjectRepository(MarketingLead)
    private readonly marketingLeadRepo: Repository<MarketingLead>,
    @InjectRepository(Advertisement)
    private readonly adRepo: Repository<Advertisement>,
    @InjectRepository(AdvertisementExpense)
    private readonly expenseRepo: Repository<AdvertisementExpense>,
    @InjectRepository(AdvertisementPerformance)
    private readonly performanceRepo: Repository<AdvertisementPerformance>,
    @InjectRepository(MarketingKpi)
    private readonly kpiRepo: Repository<MarketingKpi>,
    @InjectRepository(CampaignSummary)
    private readonly summaryRepo: Repository<CampaignSummary>,
    @InjectRepository(MarketingNotificationConfig)
    private readonly notificationConfigRepo: Repository<MarketingNotificationConfig>,
    @InjectRepository(MarketingNotificationLog)
    private readonly notificationLogRepo: Repository<MarketingNotificationLog>,
    @InjectRepository(CampaignDocument)
    private readonly documentRepo: Repository<CampaignDocument>,

    @InjectRepository(CampaignPerformanceView)
    private readonly performanceViewRepo: Repository<CampaignPerformanceView>,
    @InjectRepository(LeadSourceAnalysisView)
    private readonly leadSourceAnalysisViewRepo: Repository<LeadSourceAnalysisView>,

    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(SalesBooking)
    private readonly bookingRepo: Repository<SalesBooking>,
  ) {}

  // --- Campaign Operations ---
  async getCampaigns(): Promise<MarketingCampaign[]> {
    return this.campaignRepo.find({ order: { createdDate: 'DESC' } });
  }

  async getCampaignById(id: number): Promise<MarketingCampaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign with ID ${id} not found`);
    return campaign;
  }

  async createCampaign(dto: CreateCampaignDto): Promise<MarketingCampaign> {
    const campaign = new MarketingCampaign();
    campaign.campaignCode = dto.campaignCode;
    campaign.campaignName = dto.campaignName;
    campaign.campaignType = dto.campaignType;
    campaign.campaignObjective = dto.campaignObjective || '';
    campaign.startDate = new Date(dto.startDate);
    if (dto.endDate) campaign.endDate = new Date(dto.endDate);
    campaign.budgetAmount = dto.budgetAmount || 0;
    campaign.targetAudience = dto.targetAudience || '';
    campaign.campaignStatus = dto.campaignStatus || 'DRAFT';

    const savedCampaign = await this.campaignRepo.save(campaign);

    // Auto create corresponding campaign budget allocation
    const budget = new CampaignBudget();
    budget.campaign = savedCampaign;
    budget.allocatedBudget = savedCampaign.budgetAmount;
    budget.utilizedBudget = 0;
    budget.remainingBudget = savedCampaign.budgetAmount;
    await this.budgetRepo.save(budget);

    return savedCampaign;
  }

  async updateCampaign(id: number, dto: UpdateCampaignDto): Promise<MarketingCampaign> {
    const campaign = await this.getCampaignById(id);

    if (dto.campaignCode !== undefined) campaign.campaignCode = dto.campaignCode;
    if (dto.campaignName !== undefined) campaign.campaignName = dto.campaignName;
    if (dto.campaignType !== undefined) campaign.campaignType = dto.campaignType;
    if (dto.campaignObjective !== undefined) campaign.campaignObjective = dto.campaignObjective;
    if (dto.startDate !== undefined) campaign.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) campaign.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.targetAudience !== undefined) campaign.targetAudience = dto.targetAudience;
    if (dto.campaignStatus !== undefined) campaign.campaignStatus = dto.campaignStatus;

    if (dto.budgetAmount !== undefined) {
      campaign.budgetAmount = dto.budgetAmount;
      // Update budget allocation details
      const budget = await this.budgetRepo.findOne({ where: { campaign: { id } } });
      if (budget) {
        budget.allocatedBudget = dto.budgetAmount;
        budget.remainingBudget = budget.allocatedBudget - budget.utilizedBudget;
        await this.budgetRepo.save(budget);
      }
    }

    return this.campaignRepo.save(campaign);
  }

  async deleteCampaign(id: number): Promise<void> {
    const campaign = await this.getCampaignById(id);
    await this.campaignRepo.remove(campaign);
  }

  // --- Campaign Budget & Expenses ---
  async getCampaignBudgets(): Promise<CampaignBudget[]> {
    return this.budgetRepo.find({ relations: { campaign: true } });
  }

  // --- Advertisements ---
  async getAdvertisements(): Promise<Advertisement[]> {
    return this.adRepo.find({ relations: { campaign: true }, order: { createdDate: 'DESC' } });
  }

  async getAdvertisementById(id: number): Promise<Advertisement> {
    const ad = await this.adRepo.findOne({ where: { id }, relations: { campaign: true } });
    if (!ad) throw new NotFoundException(`Advertisement with ID ${id} not found`);
    return ad;
  }

  async createAdvertisement(dto: CreateAdvertisementDto): Promise<Advertisement> {
    const campaign = await this.getCampaignById(dto.campaignId);

    const ad = new Advertisement();
    ad.campaign = campaign;
    ad.advertisementCode = dto.advertisementCode || `AD-${Math.floor(Math.random() * 10000)}`;
    ad.advertisementTitle = dto.advertisementTitle || 'Untitled Ad';
    ad.advertisementChannel = dto.advertisementChannel || 'WEBSITE';
    ad.advertisementContent = dto.advertisementContent || '';
    if (dto.startDate) ad.startDate = new Date(dto.startDate);
    if (dto.endDate) ad.endDate = new Date(dto.endDate);
    ad.plannedBudget = dto.plannedBudget || 0;
    ad.advertisementStatus = dto.advertisementStatus || 'ACTIVE';

    return this.adRepo.save(ad);
  }

  async updateAdvertisement(id: number, dto: Partial<CreateAdvertisementDto>): Promise<Advertisement> {
    const ad = await this.getAdvertisementById(id);

    if (dto.advertisementCode !== undefined) ad.advertisementCode = dto.advertisementCode;
    if (dto.advertisementTitle !== undefined) ad.advertisementTitle = dto.advertisementTitle;
    if (dto.advertisementChannel !== undefined) ad.advertisementChannel = dto.advertisementChannel;
    if (dto.advertisementContent !== undefined) ad.advertisementContent = dto.advertisementContent;
    if (dto.startDate !== undefined) ad.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) ad.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.plannedBudget !== undefined) ad.plannedBudget = dto.plannedBudget;
    if (dto.advertisementStatus !== undefined) ad.advertisementStatus = dto.advertisementStatus;

    return this.adRepo.save(ad);
  }

  async deleteAdvertisement(id: number): Promise<void> {
    const ad = await this.getAdvertisementById(id);
    await this.adRepo.remove(ad);
  }

  // --- Expenses & Performance Tracking ---
  async getAdExpenses(adId: number): Promise<AdvertisementExpense[]> {
    return this.expenseRepo.find({ where: { advertisement: { id: adId } }, order: { expenseDate: 'DESC' } });
  }

  async recordAdExpense(adId: number, dto: RecordExpenseDto): Promise<AdvertisementExpense> {
    const ad = await this.getAdvertisementById(adId);

    const expense = new AdvertisementExpense();
    expense.advertisement = ad;
    expense.expenseDate = new Date(dto.expenseDate);
    expense.expenseType = dto.expenseType || 'Media Cost';
    expense.expenseAmount = dto.expenseAmount || 0;
    expense.vendorName = dto.vendorName || '';
    expense.paymentReference = dto.paymentReference || '';
    expense.remarks = dto.remarks || '';

    const savedExpense = await this.expenseRepo.save(expense);

    // Sync campaign budget utilization
    const campaignId = ad.campaign.id;
    const budget = await this.budgetRepo.findOne({ where: { campaign: { id: campaignId } } });
    if (budget) {
      budget.utilizedBudget = Number(budget.utilizedBudget) + Number(savedExpense.expenseAmount);
      budget.remainingBudget = budget.allocatedBudget - budget.utilizedBudget;
      await this.budgetRepo.save(budget);
    }

    return savedExpense;
  }

  async getAdPerformances(adId: number): Promise<AdvertisementPerformance[]> {
    return this.performanceRepo.find({ where: { advertisement: { id: adId } }, order: { performanceDate: 'DESC' } });
  }

  async recordAdPerformance(adId: number, dto: RecordPerformanceDto): Promise<AdvertisementPerformance> {
    const ad = await this.getAdvertisementById(adId);

    const performance = new AdvertisementPerformance();
    performance.advertisement = ad;
    performance.performanceDate = dto.performanceDate ? new Date(dto.performanceDate) : new Date();
    performance.impressions = dto.impressions || 0;
    performance.clicks = dto.clicks || 0;
    performance.inquiries = dto.inquiries || 0;
    performance.leadsGenerated = dto.leadsGenerated || 0;
    performance.conversions = dto.conversions || 0;
    performance.revenueGenerated = dto.revenueGenerated || 0;

    // Derived CPC, CPL, ROI calculations
    if (performance.clicks > 0) {
      // Find total spent on this ad to calculate real costs
      const expenses = await this.expenseRepo.find({ where: { advertisement: { id: adId } } });
      const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.expenseAmount), 0);
      performance.costPerClick = totalSpent / performance.clicks;
      if (performance.leadsGenerated > 0) {
        performance.costPerLead = totalSpent / performance.leadsGenerated;
      }
      if (totalSpent > 0) {
        performance.roiPercentage = ((performance.revenueGenerated - totalSpent) / totalSpent) * 100;
      }
    }

    return this.performanceRepo.save(performance);
  }

  // --- Lead Attribution ---
  async getMarketingLeads(): Promise<MarketingLead[]> {
    return this.marketingLeadRepo.find({
      relations: { lead: true, campaign: true, leadSource: true, advertisement: true },
      order: { createdDate: 'DESC' },
    });
  }

  async trackMarketingLead(dto: TrackLeadDto): Promise<MarketingLead> {
    const lead = await this.leadRepo.findOne({ where: { id: dto.leadId } });
    if (!lead) throw new NotFoundException(`CRM Lead with ID ${dto.leadId} not found`);

    const marketingLead = new MarketingLead();
    marketingLead.lead = lead;
    
    if (dto.campaignId) {
      marketingLead.campaign = await this.getCampaignById(dto.campaignId);
    }
    if (dto.leadSourceId) {
      const source = await this.leadSourceRepo.findOne({ where: { id: dto.leadSourceId } });
      if (source) marketingLead.leadSource = source;
    }
    if (dto.advertisementId) {
      marketingLead.advertisement = await this.getAdvertisementById(dto.advertisementId);
    }

    marketingLead.leadScore = dto.leadScore || 50;
    marketingLead.conversionProbability = dto.conversionProbability || 20;
    marketingLead.acquisitionCost = dto.acquisitionCost || 0;

    return this.marketingLeadRepo.save(marketingLead);
  }

  // --- Reporting & Dashboard View Queries ---
  async getCampaignPerformanceReport(): Promise<CampaignPerformanceView[]> {
    return this.performanceViewRepo.find();
  }

  async getLeadSourceAnalysisReport(): Promise<LeadSourceAnalysisView[]> {
    return this.leadSourceAnalysisViewRepo.find();
  }

  async getDashboardKpis() {
    // 1. Total Leads
    const totalLeads = await this.marketingLeadRepo.count();

    // 2. Qualified Leads (Probability >= 70)
    const qualifiedLeads = await this.marketingLeadRepo.createQueryBuilder('ml')
      .where('ml.conversion_probability >= :prob', { prob: 70 })
      .getCount();

    // 3. Converted Leads (Leads converted to Customers who have an approved booking)
    const convertedLeads = await this.marketingLeadRepo.createQueryBuilder('ml')
      .innerJoin('crm_customer', 'cust', 'cust.lead_id = ml.lead_id')
      .innerJoin('sales_booking', 's', 's.customer_id = cust.id')
      .getCount();

    // 4. Conversion Rate
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // 5. Marketing Cost (Sum of all advertisement expenses)
    const expenses = await this.expenseRepo.find();
    const marketingCost = expenses.reduce((sum, exp) => sum + Number(exp.expenseAmount), 0);

    // 6. Revenue Generated (Sum of revenue from converted bookings)
    const bookings = await this.bookingRepo.createQueryBuilder('s')
      .innerJoin('crm_customer', 'cust', 's.customer_id = cust.id')
      .innerJoin('rems_marketing_lead', 'ml', 'cust.lead_id = ml.lead_id')
      .select('SUM(s.booking_amount)', 'revenue')
      .getRawOne();
    
    const revenueGenerated = bookings?.revenue ? Number(bookings.revenue) : 0;

    // 7. ROI
    const roi = marketingCost > 0 ? ((revenueGenerated - marketingCost) / marketingCost) * 100 : 0;

    return {
      totalLeads,
      qualifiedLeads,
      convertedLeads,
      conversionRate,
      marketingCost,
      revenueGenerated,
      roi,
    };
  }

  async getDashboardCharts() {
    // Lead Source Trend
    const sourceTrend = await this.marketingLeadRepo.createQueryBuilder('ml')
      .leftJoin('ml.leadSource', 'ls')
      .select('COALESCE(ls.source_name, \'Unknown\')', 'source')
      .addSelect('COUNT(ml.id)', 'count')
      .groupBy('ls.source_name')
      .getRawMany();

    // Campaign Performance
    const campaigns = await this.performanceViewRepo.find();

    // Monthly Lead Growth (grouped by month of creation)
    const monthlyLeads = await this.marketingLeadRepo.createQueryBuilder('ml')
      .select('TO_CHAR(ml.created_date, \'YYYY-MM\')', 'month')
      .addSelect('COUNT(ml.id)', 'count')
      .groupBy('TO_CHAR(ml.created_date, \'YYYY-MM\')')
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      sourceTrend,
      campaigns,
      monthlyLeads,
    };
  }
}
