import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadSource } from '../entities/lead-source.entity';

@Controller('api/lead-sources')
export class LeadSourceController {
  constructor(
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
  ) {}

  @Get()
  async findAll() {
    return this.leadSourceRepo.find({ order: { sourceName: 'ASC' } });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const source = await this.leadSourceRepo.findOne({ where: { id: +id } });
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    return source;
  }

  @Post()
  async create(@Body() body: Partial<LeadSource>) {
    if (!body.sourceName) {
      throw new BadRequestException('Source name is required');
    }
    const source = new LeadSource();
    source.sourceName = body.sourceName;
    source.sourceType = body.sourceType ?? '';
    source.description = body.description ?? '';
    source.isActive = body.isActive !== undefined ? body.isActive : true;
    return this.leadSourceRepo.save(source);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<LeadSource>) {
    const source = await this.leadSourceRepo.findOne({ where: { id: +id } });
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    if (body.sourceName !== undefined) source.sourceName = body.sourceName as string;
    if (body.sourceType !== undefined) source.sourceType = body.sourceType as string;
    if (body.description !== undefined) source.description = body.description as string;
    if (body.isActive !== undefined) source.isActive = body.isActive;
    return this.leadSourceRepo.save(source);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const source = await this.leadSourceRepo.findOne({ where: { id: +id } });
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    source.isActive = false; // Soft delete / deactivation
    return this.leadSourceRepo.save(source);
  }
}
