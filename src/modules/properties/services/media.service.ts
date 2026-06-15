import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyMedia } from '../entities/property-media.entity';
import { PropertyDocument } from '../entities/property-document.entity';
import { FloorPlan } from '../entities/floor-plan.entity';
import { Property } from '../entities/property.entity';
import { Building } from '../entities/building.entity';
import { Floor } from '../entities/floor.entity';
import { Unit } from '../entities/unit.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(PropertyMedia)
    private readonly mediaRepo: Repository<PropertyMedia>,
    @InjectRepository(PropertyDocument)
    private readonly documentRepo: Repository<PropertyDocument>,
    @InjectRepository(FloorPlan)
    private readonly floorPlanRepo: Repository<FloorPlan>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
  ) {}

  async uploadPropertyMedia(
    propertyId: number,
    file: any,
    isFeatured = false,
    displayOrder = 0,
  ): Promise<PropertyMedia> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId, isDeleted: false } });
    if (!property) throw new NotFoundException(`Property with ID ${propertyId} not found.`);

    const media = this.mediaRepo.create({
      property,
      mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
      fileName: file.originalname,
      filePath: '/' + file.path.replace(/\\/g, '/').replace(/^\.?\//, ''),
      fileSize: file.size,
      mimeType: file.mimetype,
      thumbnailPath: '/' + file.path.replace(/\\/g, '/').replace(/^\.?\//, ''), // Local mock fallback
      isFeatured,
      displayOrder,
    });
    return this.mediaRepo.save(media);
  }

  async uploadPropertyDocument(
    propertyId: number,
    file: any,
    documentCategory: string,
    remarks?: string,
  ): Promise<PropertyDocument> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId, isDeleted: false } });
    if (!property) throw new NotFoundException(`Property with ID ${propertyId} not found.`);

    const document = this.documentRepo.create({
      property,
      documentCategory,
      documentName: file.originalname,
      filePath: '/' + file.path.replace(/\\/g, '/').replace(/^\.?\//, ''),
      fileSize: file.size,
      mimeType: file.mimetype,
      remarks,
    });
    return this.documentRepo.save(document);
  }

  async uploadFloorPlan(
    planName: string,
    file: any,
    propertyId?: number,
    buildingId?: number,
    floorId?: number,
    unitId?: number,
    remarks?: string,
    versionNumber?: number,
  ): Promise<FloorPlan> {
    let property: Property | null = null;
    if (propertyId) {
      property = await this.propertyRepo.findOne({ where: { id: propertyId, isDeleted: false } });
    }
    let building: Building | null = null;
    if (buildingId) {
      building = await this.buildingRepo.findOne({ where: { id: buildingId, isDeleted: false } });
    }
    let floor: Floor | null = null;
    if (floorId) {
      floor = await this.floorRepo.findOne({ where: { id: floorId, isDeleted: false } });
    }
    let unit: Unit | null = null;
    if (unitId) {
      unit = await this.unitRepo.findOne({ where: { id: unitId, isDeleted: false } });
    }

    const plan = this.floorPlanRepo.create({
      planName,
      filePath: '/' + file.path.replace(/\\/g, '/').replace(/^\.?\//, ''),
      fileType: file.mimetype,
      remarks,
      versionNumber: versionNumber ?? 1,
      property,
      building,
      floor,
      unit,
    } as any);
    return this.floorPlanRepo.save(plan as any);
  }
}
