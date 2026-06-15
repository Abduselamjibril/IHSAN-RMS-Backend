import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { OpportunityService } from '../services/opportunity.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('CRM')
@Controller('api/opportunities')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Post('convert/:leadId')
  @ApiOperation({ summary: 'Convert a Lead into an Opportunity' })
  @ApiParam({ name: 'leadId', description: 'Lead ID to convert' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Abel Legesse - Bole Apartment Opportunity' },
        estimatedValue: { type: 'number', example: 5000000 },
        expectedCloseDate: { type: 'string', example: '2026-12-31' },
        remarks: { type: 'string', example: 'Client is highly interested in Bole property.' },
      },
      required: ['title', 'estimatedValue'],
    },
  })
  async convertLead(
    @Param('leadId') leadId: string,
    @Body() body: { title: string; estimatedValue: number; expectedCloseDate: string; remarks?: string },
  ) {
    return this.opportunityService.convertLeadToOpportunity(+leadId, body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all opportunities with optional pagination and filtering' })
  async findAll(@Query() query: any) {
    return this.opportunityService.findAll(query);
  }

  @Get('metadata')
  @ApiOperation({ summary: 'Get metadata for opportunities (stages, loss reasons, agents)' })
  async getMetadata() {
    return this.opportunityService.getMetadata();
  }

  @Get('stats/forecast')
  @ApiOperation({ summary: 'Get expected revenue forecasting statistics' })
  async getForecast() {
    return this.opportunityService.getForecast();
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiOperation({ summary: 'Get details of an opportunity including activity logs and notes' })
  async findOne(@Param('id') id: string) {
    return this.opportunityService.findOne(+id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiOperation({ summary: 'Update opportunity details' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.opportunityService.updateOpportunity(+id, body);
  }

  @Put(':id/stage')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stageId: { type: 'number', example: 2 },
      },
      required: ['stageId'],
    },
  })
  @ApiOperation({ summary: 'Change the pipeline stage of an opportunity' })
  async updateStage(@Param('id') id: string, @Body('stageId') stageId: number) {
    return this.opportunityService.updateStage(+id, stageId);
  }

  @Post(':id/close-lost')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lossReasonId: { type: 'number', example: 1 },
        remarks: { type: 'string', example: 'Decided to buy in different sub-city.' },
      },
      required: ['lossReasonId'],
    },
  })
  @ApiOperation({ summary: 'Close the opportunity as Lost' })
  async closeLost(
    @Param('id') id: string,
    @Body() body: { lossReasonId: number; remarks?: string },
  ) {
    return this.opportunityService.closeLost(+id, body.lossReasonId, body.remarks);
  }

  @Post(':id/activity')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiOperation({ summary: 'Log a customer activity log for the opportunity' })
  async addActivity(@Param('id') id: string, @Body() body: any) {
    return this.opportunityService.addActivity(+id, body);
  }

  @Post(':id/notes')
  @ApiParam({ name: 'id', description: 'Opportunity ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        note: { type: 'string', example: 'Met client at the office. Prefers higher floor.' },
      },
      required: ['note'],
    },
  })
  @ApiOperation({ summary: 'Log an internal note for the opportunity' })
  async addNote(@Param('id') id: string, @Body('note') note: string) {
    return this.opportunityService.addNote(+id, note);
  }
}
