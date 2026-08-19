import { Controller, Get, Post, Put, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from '../services/pricing.service';
import {
  CreateUnitPriceDto,
  CreatePromotionDto,
  CreatePriceChangeRequestDto,
  ReviewPriceChangeRequestDto,
} from '../dto/unit-crud.dto';

@ApiTags('Properties')
@Controller('api/unit-prices')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Post()
  createUnitPrice(@Body() dto: CreateUnitPriceDto, @Req() req: any) {
    return this.service.createUnitPrice(dto, req?.user);
  }

  @Get('unit/:unitId/history')
  getUnitPriceHistory(@Param('unitId') unitId: string) {
    return this.service.getUnitPriceHistory(+unitId);
  }

  @Post('change-requests')
  createPriceChangeRequest(@Body() dto: CreatePriceChangeRequestDto, @Req() req: any) {
    return this.service.createPriceChangeRequest(dto, req?.user);
  }

  @Get('change-requests')
  getPriceChangeRequests(@Query('status') status?: string) {
    return this.service.getPriceChangeRequests(status);
  }

  @Post('change-requests/:id/approve')
  approvePriceChangeRequest(
    @Param('id') id: string,
    @Body() dto: ReviewPriceChangeRequestDto,
    @Req() req: any,
  ) {
    return this.service.approvePriceChangeRequest(+id, req?.user, dto?.comment);
  }

  @Post('change-requests/:id/reject')
  rejectPriceChangeRequest(
    @Param('id') id: string,
    @Body() dto: ReviewPriceChangeRequestDto,
    @Req() req: any,
  ) {
    return this.service.rejectPriceChangeRequest(+id, req?.user, dto?.comment);
  }

  @Post('promotions')
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.service.createPromotion(dto);
  }

  @Get('promotions/active')
  getActivePromotions() {
    return this.service.getActivePromotions();
  }

  @Get('promotions')
  getAllPromotions() {
    return this.service.getAllPromotions();
  }

  @Put('promotions/:id')
  updatePromotion(@Param('id') id: string, @Body() dto: CreatePromotionDto) {
    return this.service.updatePromotion(+id, dto);
  }

  @Patch('promotions/:id/deactivate')
  deactivatePromotion(@Param('id') id: string) {
    return this.service.deactivatePromotion(+id);
  }
}
