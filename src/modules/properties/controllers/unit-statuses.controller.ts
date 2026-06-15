import { Controller, Get, Put, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitStatus } from '../entities/unit-status.entity';

@ApiTags('Properties')
@Controller('api/unit-statuses')
export class UnitStatusesController {
  constructor(
    @InjectRepository(UnitStatus)
    private readonly unitStatusRepo: Repository<UnitStatus>,
  ) {}

  @Get()
  async findAll(): Promise<UnitStatus[]> {
    return this.unitStatusRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: { colorCode?: string; isSellable?: boolean; sortOrder?: number },
  ): Promise<UnitStatus> {
    const status = await this.unitStatusRepo.findOne({ where: { id: +id } });
    if (!status) {
      throw new NotFoundException(`Unit Status with ID ${id} not found.`);
    }
    if (dto.colorCode !== undefined) status.colorCode = dto.colorCode;
    if (dto.isSellable !== undefined) status.isSellable = dto.isSellable;
    if (dto.sortOrder !== undefined) status.sortOrder = dto.sortOrder;
    return this.unitStatusRepo.save(status);
  }
}
