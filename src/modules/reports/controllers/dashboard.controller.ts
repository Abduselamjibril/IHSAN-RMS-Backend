import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Reporting & Dashboards')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  async getKpis() {
    return this.service.getKpis();
  }

  @Get('realtime')
  async getRealTimeStats() {
    return this.service.getRealTimeStats();
  }

  @Get('trends/sales')
  async getSalesTrends(@Query('freq') freq: 'daily' | 'monthly' | 'annual') {
    return this.service.getSalesTrends(freq || 'monthly');
  }

  @Get('trends/revenue')
  async getRevenueTrends() {
    return this.service.getRevenueTrends();
  }

  @Get('trends/collections')
  async getCollectionTrends() {
    return this.service.getCollectionTrends();
  }

  @Get('trends/leads')
  async getLeadTrends() {
    return this.service.getLeadTrends();
  }

  @Get('trends/brokers')
  async getBrokerTrends() {
    return this.service.getBrokerTrends();
  }
}
