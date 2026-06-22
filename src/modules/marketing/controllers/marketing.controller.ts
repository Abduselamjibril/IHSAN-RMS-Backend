import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketingService } from '../services/marketing.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateAdvertisementDto,
  RecordExpenseDto,
  RecordPerformanceDto,
  TrackLeadDto,
} from '../dto/marketing.dto';

@ApiTags('Marketing')
@Controller('api/marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  // --- Campaign Endpoints ---
  @Get('campaigns')
  @ApiOperation({ summary: 'Get all marketing campaigns' })
  async getCampaigns() {
    return this.marketingService.getCampaigns();
  }

  @Get('campaigns/budgets')
  @ApiOperation({ summary: 'Get all campaign budget allocations' })
  async getCampaignBudgets() {
    return this.marketingService.getCampaignBudgets();
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign details by ID' })
  async getCampaignById(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getCampaignById(id);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new marketing campaign' })
  async createCampaign(@Body() dto: CreateCampaignDto) {
    return this.marketingService.createCampaign(dto);
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Update a marketing campaign' })
  async updateCampaign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.marketingService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a marketing campaign' })
  async deleteCampaign(@Param('id', ParseIntPipe) id: number) {
    await this.marketingService.deleteCampaign(id);
    return { message: 'Campaign deleted successfully' };
  }

  // --- Advertisement Endpoints ---
  @Get('advertisements')
  @ApiOperation({ summary: 'Get all advertisements' })
  async getAdvertisements() {
    return this.marketingService.getAdvertisements();
  }

  @Get('advertisements/:id')
  @ApiOperation({ summary: 'Get advertisement details' })
  async getAdvertisementById(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getAdvertisementById(id);
  }

  @Post('advertisements')
  @ApiOperation({ summary: 'Register a new advertisement' })
  async createAdvertisement(@Body() dto: CreateAdvertisementDto) {
    return this.marketingService.createAdvertisement(dto);
  }

  @Put('advertisements/:id')
  @ApiOperation({ summary: 'Update advertisement details' })
  async updateAdvertisement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateAdvertisementDto>,
  ) {
    return this.marketingService.updateAdvertisement(id, dto);
  }

  @Delete('advertisements/:id')
  @ApiOperation({ summary: 'Delete advertisement' })
  async deleteAdvertisement(@Param('id', ParseIntPipe) id: number) {
    await this.marketingService.deleteAdvertisement(id);
    return { message: 'Advertisement deleted successfully' };
  }

  // --- Advertisement Expense & Performance ---
  @Get('advertisements/:id/expenses')
  @ApiOperation({ summary: 'Get expenses logged for an advertisement' })
  async getAdExpenses(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getAdExpenses(id);
  }

  @Post('advertisements/:id/expenses')
  @ApiOperation({ summary: 'Log an expense for an advertisement' })
  async recordAdExpense(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordExpenseDto,
  ) {
    return this.marketingService.recordAdExpense(id, dto);
  }

  @Get('advertisements/:id/performances')
  @ApiOperation({ summary: 'Get performance logs for an advertisement' })
  async getAdPerformances(@Param('id', ParseIntPipe) id: number) {
    return this.marketingService.getAdPerformances(id);
  }

  @Post('advertisements/:id/performances')
  @ApiOperation({ summary: 'Record daily performance stats for an ad' })
  async recordAdPerformance(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPerformanceDto,
  ) {
    return this.marketingService.recordAdPerformance(id, dto);
  }

  // --- Lead Attribution ---
  @Get('leads')
  @ApiOperation({ summary: 'Get all marketing lead attributions' })
  async getMarketingLeads() {
    return this.marketingService.getMarketingLeads();
  }

  @Post('leads')
  @ApiOperation({ summary: 'Link CRM lead to marketing campaign / source' })
  async trackMarketingLead(@Body() dto: TrackLeadDto) {
    return this.marketingService.trackMarketingLead(dto);
  }

  // --- Reports & Dashboards ---
  @Get('reports/performance')
  @ApiOperation({ summary: 'Get campaign performance reports (VW)' })
  async getCampaignPerformanceReport() {
    return this.marketingService.getCampaignPerformanceReport();
  }

  @Get('reports/lead-sources')
  @ApiOperation({ summary: 'Get lead source analysis reports (VW)' })
  async getLeadSourceAnalysisReport() {
    return this.marketingService.getLeadSourceAnalysisReport();
  }

  @Get('reports/dashboard/kpis')
  @ApiOperation({ summary: 'Get marketing dashboard executive KPIs' })
  async getDashboardKpis() {
    return this.marketingService.getDashboardKpis();
  }

  @Get('reports/dashboard/charts')
  @ApiOperation({ summary: 'Get marketing dashboard chart metrics' })
  async getDashboardCharts() {
    return this.marketingService.getDashboardCharts();
  }
}
