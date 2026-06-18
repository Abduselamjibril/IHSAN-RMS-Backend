import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { SegmentationService } from '../services/segmentation.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('CRM')
@Controller('api/segments')
export class SegmentationController {
  constructor(private readonly segmentationService: SegmentationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all segments with metadata (rule count and member count)' })
  async findAll() {
    return this.segmentationService.findAllSegments();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all lead tags' })
  async getTags() {
    return this.segmentationService.findAllTags();
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a new lead tag' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tagName: { type: 'string', example: 'VIP' },
        colorCode: { type: 'string', example: '#ef4444' },
      },
      required: ['tagName'],
    },
  })
  async createTag(@Body() body: { tagName: string; colorCode?: string }) {
    return this.segmentationService.createTag(body);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Segment ID' })
  @ApiOperation({ summary: 'Get details of a segment including members and rules' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.segmentationService.findOneSegment(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new segment and execute its rules' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        segmentName: { type: 'string', example: 'High Budget Addis' },
        description: { type: 'string', example: 'Leads with budget > 5M in Addis Ababa' },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fieldName: { type: 'string', example: 'budgetMin' },
              operator: { type: 'string', example: '>' },
              value: { type: 'string', example: '5000000' },
            },
            required: ['fieldName', 'operator', 'value'],
          },
        },
      },
      required: ['segmentName'],
    },
  })
  async create(
    @Body()
    body: {
      segmentName: string;
      description?: string;
      rules: { fieldName: string; operator: string; value: string }[];
    },
  ) {
    try {
      return await this.segmentationService.createSegment(body);
    } catch (err) {
      console.error('[SEGMENT CREATION ERROR]', err);
      throw new BadRequestException({
        message: 'Segment creation failed',
        error: err.message,
        stack: err.stack,
      });
    }
  }

  @Post(':id/recalculate')
  @ApiParam({ name: 'id', description: 'Segment ID' })
  @ApiOperation({ summary: 'Recalculate dynamic segment members' })
  async recalculate(@Param('id', ParseIntPipe) id: number) {
    return this.segmentationService.recalculateSegment(id);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Segment ID' })
  @ApiOperation({ summary: 'Delete a customer segment' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.segmentationService.deleteSegment(id);
  }
}
