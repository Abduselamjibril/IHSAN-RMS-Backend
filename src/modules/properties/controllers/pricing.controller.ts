import { Controller, Get, Post, Body } from '@nestjs/common';
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
}
