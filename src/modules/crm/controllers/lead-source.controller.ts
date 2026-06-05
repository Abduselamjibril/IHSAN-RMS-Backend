import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadSource } from '../entities/lead-source.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('lead-sources')
@Controller('api/lead-sources')
export class LeadSourceController {
  constructor(
    @InjectRepository(LeadSource)
    private readonly leadSourceRepo: Repository<LeadSource>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all lead sources' })
  @ApiResponse({ status: 200, description: 'List of all lead sources' })
  async findAll() {
    return this.leadSourceRepo.find({ order: { sourceName: 'ASC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead source by ID' })
  @ApiParam({ name: 'id', description: 'Lead source ID' })
  @ApiResponse({ status: 200, description: 'The lead source details' })
  @ApiResponse({ status: 404, description: 'Lead source not found' })
  async findOne(@Param('id') id: string) {
    const source = await this.leadSourceRepo.findOne({ where: { id: +id } });
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    return source;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead source' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceName: { type: 'string', example: 'Social Media' },
        sourceType: { type: 'string', example: 'Facebook Ad' },
        description: { type: 'string', example: 'Leads from Facebook and Instagram campaigns' },
        isActive: { type: 'boolean', example: true },
      },
      required: ['sourceName'],
    },
  })
  @ApiResponse({ status: 201, description: 'Lead source successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
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
  @ApiOperation({ summary: 'Update a lead source' })
  @ApiParam({ name: 'id', description: 'Lead source ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sourceName: { type: 'string' },
        sourceType: { type: 'string' },
        description: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Lead source updated' })
  @ApiResponse({ status: 404, description: 'Lead source not found' })
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
  @ApiOperation({ summary: 'Soft delete / deactivate a lead source' })
  @ApiParam({ name: 'id', description: 'Lead source ID' })
  @ApiResponse({ status: 200, description: 'Lead source deactivated' })
  @ApiResponse({ status: 404, description: 'Lead source not found' })
  async remove(@Param('id') id: string) {
    const source = await this.leadSourceRepo.findOne({ where: { id: +id } });
    if (!source) {
      throw new NotFoundException(`Lead source with ID ${id} not found`);
    }
    source.isActive = false; // Soft delete / deactivation
    return this.leadSourceRepo.save(source);
  }
}

