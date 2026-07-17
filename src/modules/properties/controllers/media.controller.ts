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

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
  'text/csv', 'text/plain'
];

const fileFilterHelper = (req: any, file: any, cb: any) => {
  const ext = extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException(`Unsupported file type: ${ext}`), false);
  }
  cb(null, true);
};

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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: fileFilterHelper
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: fileFilterHelper
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
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: fileFilterHelper
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
