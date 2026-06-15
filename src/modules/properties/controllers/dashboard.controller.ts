import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('Properties')
@Controller('api/inventory/dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  getStats() {
    return this.service.getInventoryStatistics();
  }
}
