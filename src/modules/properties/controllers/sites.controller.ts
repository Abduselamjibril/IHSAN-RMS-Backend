import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SitesService } from '../services/sites.service';
import { CreateSiteDto, UpdateSiteDto } from '../dto/property-crud.dto';

@ApiTags('Sites')
@Controller('api/properties')
export class SitesController {
  constructor(private readonly service: SitesService) {}

  @Post(':propertyId/sites')
  createSite(@Param('propertyId') propertyId: string, @Body() dto: CreateSiteDto) {
    return this.service.createSite(+propertyId, dto);
  }

  @Get(':propertyId/sites')
  findAllSites(@Param('propertyId') propertyId: string) {
    return this.service.findAllSites(+propertyId);
  }

  @Get('sites/:id')
  findOneSite(@Param('id') id: string) {
    return this.service.findOneSite(+id);
  }

  @Put('sites/:id')
  updateSite(@Param('id') id: string, @Body() dto: UpdateSiteDto) {
    return this.service.updateSite(+id, dto);
  }

  @Delete('sites/:id')
  removeSite(@Param('id') id: string) {
    return this.service.removeSite(+id);
  }
}
