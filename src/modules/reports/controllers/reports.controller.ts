import { Controller, Get, Post, Body, Query, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';

@ApiTags('Reporting & Dashboards')
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  async getTemplates() {
    return this.service.findAllTemplates();
  }

  @Get('sales')
  async getSalesReport(@Query() query: any) {
    return this.service.getSalesReport(query);
  }

  @Get('inventory/availability')
  async getInventoryAvailabilityReport(@Query() query: any) {
    return this.service.getInventoryAvailabilityReport(query);
  }

  @Get('inventory/aging')
  async getInventoryAgingReport(@Query() query: any) {
    return this.service.getInventoryAgingReport(query);
  }

  @Get('properties/availability')
  async getPropertyAvailabilityReport(@Query() query: any) {
    return this.service.getPropertyAvailabilityReport(query);
  }

  @Get('revenue')
  async getRevenueReport(@Query() query: any) {
    return this.service.getRevenueReport(query);
  }

  @Get('collections')
  async getCollectionReport(@Query() query: any) {
    return this.service.getCollectionReport(query);
  }

  @Get('outstanding-balances')
  async getReceivablesReport(@Query() query: any) {
    return this.service.getReceivablesReport(query);
  }

  @Get('lead-conversions')
  async getLeadFunnelReport(@Query() query: any) {
    return this.service.getLeadFunnelReport(query);
  }

  @Get('broker-commissions')
  async getBrokerCommissionsReport(@Query() query: any) {
    return this.service.getBrokerCommissionsReport(query);
  }

  @Get('schedules')
  async getSchedules() {
    return this.service.findAllSchedules();
  }

  @Post('schedules')
  async createSchedule(@Body() body: any) {
    return this.service.createSchedule(body);
  }

  @Get(':reportId')
  async getTemplate(@Param('reportId') id: string) {
    return this.service.findTemplateById(+id);
  }

  @Post('export')
  async exportReport(
    @Body() body: { reportCode: string; query: any; columns: string[] },
    @Res() res: any,
  ) {
    let data: any[] = [];
    const code = body.reportCode;
    const q = body.query || {};

    if (code === 'SALES_PERFORMANCE') {
      data = (await this.service.getSalesReport(q)).items;
    } else if (code === 'INVENTORY_AVAILABILITY') {
      data = (await this.service.getInventoryAvailabilityReport(q)).items;
    } else if (code === 'INVENTORY_AGING') {
      data = (await this.service.getInventoryAgingReport(q)).items;
    } else if (code === 'PROPERTY_AVAILABILITY') {
      data = (await this.service.getPropertyAvailabilityReport(q)).items;
    } else if (code === 'REVENUE_ANALYSIS') {
      data = (await this.service.getRevenueReport(q)).items;
    } else if (code === 'COLLECTION_MONITORING') {
      data = (await this.service.getCollectionReport(q)).items;
    } else if (code === 'RECEIVABLE_MONITORING') {
      data = (await this.service.getReceivablesReport(q)).items;
    } else if (code === 'BROKER_COMMISSIONS') {
      data = (await this.service.getBrokerCommissionsReport(q)).items;
    }

    const csv = await this.service.exportToCsv(data, body.columns || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${code.toLowerCase()}_report.csv"`);
    return res.send(csv);
  }
}
