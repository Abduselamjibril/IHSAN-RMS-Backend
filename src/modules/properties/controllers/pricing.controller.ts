import { Controller, Get, Post, Put, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from '../services/pricing.service';
import { CreateUnitPriceDto, CreatePromotionDto } from '../dto/unit-crud.dto';

@ApiTags('Properties')
@Controller('api/unit-prices')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Post()
  createUnitPrice(@Body() dto: CreateUnitPriceDto) {
    return this.service.createUnitPrice(dto);
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
