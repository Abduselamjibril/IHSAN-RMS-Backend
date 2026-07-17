import { Controller, Get, Post, Param, Body, Query, UseInterceptors, UploadedFile, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentService } from '../services/document.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';

@ApiTags('CRM')
@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customer documents with optional filtering' })
  async findAll(@Query() query: any) {
    return this.documentService.findAll(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiOperation({ summary: 'Get details of a customer document' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    // Log view action
    await this.documentService.logAccess(id, 'View', 1);
    return this.documentService.findOne(id);
  }

  @Get(':id/versions')
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiOperation({ summary: 'Get version history of a customer document' })
  async getVersions(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.getVersions(id);
  }

  @Get(':id/access-logs')
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiOperation({ summary: 'Get access log history' })
  async getAccessLogs(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.getAccessLogs(id);
  }

  @Post(':leadId')
  @ApiParam({ name: 'leadId', description: 'Lead ID' })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new customer document' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'text/csv', 'text/plain'
      ];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${ext}`), false);
      }
      cb(null, true);
    }
  }))
  async uploadDocument(
    @Param('leadId', ParseIntPipe) leadId: number,
    @UploadedFile() file: any,
    @Body() body: { category: string; expiryDate?: string; accessRole?: string },
  ) {
    if (!file) throw new BadRequestException('File is required.');
    return this.documentService.uploadDocument(leadId, file, body);
  }

  @Post(':id/version')
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new version of an existing document' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'text/csv', 'text/plain'
      ];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${ext}`), false);
      }
      cb(null, true);
    }
  }))
  async addVersion(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('File is required.');
    return this.documentService.addVersion(id, file);
  }

  @Post('cron/check-expiry')
  @ApiOperation({ summary: 'Trigger validation check of document expiration dates and notify agents' })
  async checkExpiry() {
    return this.documentService.checkExpiry();
  }
}
