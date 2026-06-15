import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AmenitiesService } from '../services/amenities.service';
import { CreateAmenityDto, UpdateAmenityDto } from '../dto/master-crud.dto';

@ApiTags('Properties')
@Controller('api/amenities')
export class AmenitiesController {
  constructor(private readonly service: AmenitiesService) {}

  @Post()
  create(@Body() dto: CreateAmenityDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
