import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UnitsService } from '../services/units.service';
import { CreateUnitDto, UpdateUnitDto, UpdateUnitStatusDto } from '../dto/unit-crud.dto';

@ApiTags('Properties')
@Controller('api/units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Post()
  createUnit(@Body() dto: CreateUnitDto) {
    return this.service.createUnit(dto);
  }

  @Get()
  findAllUnits(@Query() query: any) {
    return this.service.findAllUnits(query);
  }

  @Get('status-history')
  getStatusHistory() {
    return this.service.getStatusHistory();
  }

  @Get(':id')
  findOneUnit(@Param('id') id: string) {
    return this.service.findOneUnit(+id);
  }

  @Put(':id')
  updateUnit(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.service.updateUnit(+id, dto);
  }

  @Delete(':id')
  removeUnit(@Param('id') id: string) {
    return this.service.removeUnit(+id);
  }

  @Put(':id/status')
  transitionStatus(@Param('id') id: string, @Body() dto: UpdateUnitStatusDto) {
    return this.service.transitionStatus(+id, dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImportCsv(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('CSV file attachment is required.');
    }
    const fileContent = file.buffer.toString('utf-8');
    return this.service.bulkImportCsv(file.originalname, fileContent);
  }
}
