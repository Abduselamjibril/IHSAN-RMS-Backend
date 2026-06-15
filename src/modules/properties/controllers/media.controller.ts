import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from '../services/media.service';

@ApiTags('Properties')
@Controller('api/property-media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPropertyMedia(
    @UploadedFile() file: any,
    @Body('propertyId') propertyId: string,
    @Body('isFeatured') isFeatured?: string,
    @Body('displayOrder') displayOrder?: string,
  ) {
    if (!file) throw new BadRequestException('File is required.');
    if (!propertyId) throw new BadRequestException('propertyId is required.');

    const featured = isFeatured === 'true';
    const order = displayOrder ? parseInt(displayOrder) : 0;

    return this.service.uploadPropertyMedia(+propertyId, file, featured, order);
  }

  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadPropertyDocument(
    @UploadedFile() file: any,
    @Body('propertyId') propertyId: string,
    @Body('documentCategory') documentCategory: string,
    @Body('remarks') remarks?: string,
  ) {
    if (!file) throw new BadRequestException('File is required.');
    if (!propertyId) throw new BadRequestException('propertyId is required.');
    if (!documentCategory) throw new BadRequestException('documentCategory is required.');

    return this.service.uploadPropertyDocument(+propertyId, file, documentCategory, remarks);
  }

  @Post('floorplans')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/floorplans',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFloorPlan(
    @UploadedFile() file: any,
    @Body('planName') planName: string,
    @Body('propertyId') propertyId?: string,
    @Body('buildingId') buildingId?: string,
    @Body('floorId') floorId?: string,
    @Body('unitId') unitId?: string,
    @Body('remarks') remarks?: string,
    @Body('versionNumber') versionNumber?: string,
  ) {
    if (!file) throw new BadRequestException('File is required.');
    if (!planName) throw new BadRequestException('planName is required.');

    const propId = propertyId ? +propertyId : undefined;
    const bldId = buildingId ? +buildingId : undefined;
    const flId = floorId ? +floorId : undefined;
    const unId = unitId ? +unitId : undefined;
    const vNum = versionNumber ? +versionNumber : undefined;

    return this.service.uploadFloorPlan(planName, file, propId, bldId, flId, unId, remarks, vNum);
  }
}
