import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UnitTypesService } from '../services/unit-types.service';
import { CreateUnitTypeDto, UpdateUnitTypeDto } from '../dto/master-crud.dto';

@ApiTags('Properties')
@Controller('api/unit-types')
export class UnitTypesController {
  constructor(private readonly service: UnitTypesService) {}

  @Post()
  create(@Body() dto: CreateUnitTypeDto) {
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
  update(@Param('id') id: string, @Body() dto: UpdateUnitTypeDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
