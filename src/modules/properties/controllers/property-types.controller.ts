import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PropertyTypesService } from '../services/property-types.service';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from '../dto/master-crud.dto';

@ApiTags('Properties')
@Controller('api/property-types')
export class PropertyTypesController {
  constructor(private readonly service: PropertyTypesService) {}

  @Post()
  create(@Body() dto: CreatePropertyTypeDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdatePropertyTypeDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
