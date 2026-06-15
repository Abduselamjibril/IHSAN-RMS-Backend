import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PropertiesService } from '../services/properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateFloorDto,
  UpdateFloorDto,
} from '../dto/property-crud.dto';

@ApiTags('Properties')
@Controller('api/properties')
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Post()
  createProperty(@Body() dto: CreatePropertyDto) {
    return this.service.createProperty(dto);
  }

  @Get()
  findAllProperties(@Query() query: any) {
    return this.service.findAllProperties(query);
  }

  @Get(':id')
  findOneProperty(@Param('id') id: string) {
    return this.service.findOneProperty(+id);
  }

  @Put(':id')
  updateProperty(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.service.updateProperty(+id, dto);
  }

  @Delete(':id')
  removeProperty(@Param('id') id: string) {
    return this.service.removeProperty(+id);
  }

  // --- Building Endpoints ---

  @Post(':id/buildings')
  createBuilding(@Param('id') id: string, @Body() dto: CreateBuildingDto) {
    dto.propertyId = +id;
    return this.service.createBuilding(dto);
  }

  @Get('buildings/:id')
  findOneBuilding(@Param('id') id: string) {
    return this.service.findOneBuilding(+id);
  }

  @Put('buildings/:id')
  updateBuilding(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.service.updateBuilding(+id, dto);
  }

  @Delete('buildings/:id')
  removeBuilding(@Param('id') id: string) {
    return this.service.removeBuilding(+id);
  }

  // --- Floor Endpoints ---

  @Post('buildings/:id/floors')
  createFloor(@Param('id') id: string, @Body() dto: CreateFloorDto) {
    dto.buildingId = +id;
    return this.service.createFloor(dto);
  }

  @Put('floors/:id')
  updateFloor(@Param('id') id: string, @Body() dto: UpdateFloorDto) {
    return this.service.updateFloor(+id, dto);
  }

  @Delete('floors/:id')
  removeFloor(@Param('id') id: string) {
    return this.service.removeFloor(+id);
  }
}
