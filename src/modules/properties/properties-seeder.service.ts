import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyType } from './entities/property-type.entity';
import { UnitType } from './entities/unit-type.entity';
import { UnitStatus } from './entities/unit-status.entity';
import { AmenityMaster } from './entities/amenity-master.entity';
import { Property } from './entities/property.entity';
import { PropertyMedia } from './entities/property-media.entity';
import { PropertyDocument } from './entities/property-document.entity';

@Injectable()
export class PropertiesSeederService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesSeederService.name);

  constructor(
    @InjectRepository(PropertyType)
    private readonly propertyTypeRepo: Repository<PropertyType>,
    @InjectRepository(UnitType)
    private readonly unitTypeRepo: Repository<UnitType>,
    @InjectRepository(UnitStatus)
    private readonly unitStatusRepo: Repository<UnitStatus>,
    @InjectRepository(AmenityMaster)
    private readonly amenityMasterRepo: Repository<AmenityMaster>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyMedia)
    private readonly mediaRepo: Repository<PropertyMedia>,
    @InjectRepository(PropertyDocument)
    private readonly documentRepo: Repository<PropertyDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking for Properties lookup seed data...');
    await this.seedPropertyTypes();
    await this.seedUnitTypes();
    await this.seedUnitStatuses();
    await this.seedAmenities();
    await this.seedMediaAndDocuments();
    this.logger.log('Properties lookup seed check completed.');
  }

  private async seedPropertyTypes() {
    const count = await this.propertyTypeRepo.count();
    if (count === 0) {
      this.logger.log('Seeding Properties Property Types...');
      const types = [
        { typeName: 'Apartment', description: 'Multi-family residential apartment unit or block' },
        { typeName: 'Villa', description: 'Standalone residential private luxury house' },
        { typeName: 'Commercial', description: 'Offices, retail space, or commercial buildings' },
        { typeName: 'Mixed-use', description: 'Buildings combining residential and commercial space' },
        { typeName: 'Land', description: 'Plots of land registered for development projects' },
      ];
      await this.propertyTypeRepo.save(types);
      this.logger.log(`Seeded ${types.length} Property Types.`);
    }
  }

  private async seedUnitTypes() {
    const count = await this.unitTypeRepo.count();
    if (count === 0) {
      this.logger.log('Seeding Properties Unit Types...');
      const types = [
        { typeName: 'Studio', description: 'Single room apartment integrating bedroom and living area' },
        { typeName: 'Apartment', description: 'Standard multi-bedroom residential apartment unit' },
        { typeName: 'Penthouse', description: 'Luxury top-floor apartment unit with premium views' },
        { typeName: 'Villa', description: 'High-end standalone or semi-detached residential unit' },
        { typeName: 'Office', description: 'Registered business office space' },
        { typeName: 'Shop', description: 'Retail commercial outlet' },
      ];
      await this.unitTypeRepo.save(types);
      this.logger.log(`Seeded ${types.length} Unit Types.`);
    }
  }

  private async seedUnitStatuses() {
    const count = await this.unitStatusRepo.count();
    if (count === 0) {
      this.logger.log('Seeding Properties Unit Statuses...');
      const statuses = [
        { statusName: 'Available', colorCode: '#28a745', isSellable: true, sortOrder: 1 },
        { statusName: 'Reserved', colorCode: '#ffc107', isSellable: false, sortOrder: 2 },
        { statusName: 'Sold', colorCode: '#dc3545', isSellable: false, sortOrder: 3 },
        { statusName: 'Blocked', colorCode: '#6c757d', isSellable: false, sortOrder: 4 },
        { statusName: 'Maintenance', colorCode: '#17a2b8', isSellable: false, sortOrder: 5 },
      ];
      await this.unitStatusRepo.save(statuses);
      this.logger.log(`Seeded ${statuses.length} Unit Statuses.`);
    }
  }

  private async seedAmenities() {
    const count = await this.amenityMasterRepo.count();
    if (count === 0) {
      this.logger.log('Seeding Properties Amenity Master...');
      const amenities = [
        { amenityName: 'Parking', icon: 'local_parking', description: 'Dedicated vehicle parking slots' },
        { amenityName: 'Gym', icon: 'fitness_center', description: 'Equipped state-of-the-art gym center' },
        { amenityName: 'Swimming pool', icon: 'pool', description: 'Indoor/outdoor swimming pool area' },
        { amenityName: 'Security', icon: 'security', description: '24/7 round-the-clock physical security guards and surveillance' },
        { amenityName: 'Elevator', icon: 'elevator', description: 'High-speed automated elevators' },
      ];
      await this.amenityMasterRepo.save(amenities);
      this.logger.log(`Seeded ${amenities.length} Amenities.`);
    }
  }

  private async seedMediaAndDocuments() {
    const propertyCount = await this.propertyRepo.count();
    if (propertyCount > 0) {
      const mediaCount = await this.mediaRepo.count();
      const documentCount = await this.documentRepo.count();
      
      if (mediaCount === 0 || documentCount === 0) {
        this.logger.log('Seeding dummy property media and documents...');
        const properties = await this.propertyRepo.find();
        
        for (const p of properties) {
          if (mediaCount === 0) {
            // Seed a cover photo and a gallery photo
            const media1 = this.mediaRepo.create({
              property: p,
              mediaType: 'image',
              fileName: 'project_cover.jpg',
              filePath: '/uploads/media/cover.jpg',
              fileSize: 102400,
              mimeType: 'image/jpeg',
              thumbnailPath: '/uploads/media/cover.jpg',
              isFeatured: true,
              displayOrder: 1,
            });
            const media2 = this.mediaRepo.create({
              property: p,
              mediaType: 'image',
              fileName: 'interior_view.jpg',
              filePath: '/uploads/media/interior.jpg',
              fileSize: 153600,
              mimeType: 'image/jpeg',
              thumbnailPath: '/uploads/media/interior.jpg',
              isFeatured: false,
              displayOrder: 2,
            });
            await this.mediaRepo.save([media1, media2]);
          }

          if (documentCount === 0) {
            // Seed a contract and a floor plan pdf
            const doc1 = this.documentRepo.create({
              property: p,
              documentCategory: 'Agreement',
              documentName: 'Purchase_Contract.pdf',
              filePath: '/uploads/documents/contract.pdf',
              fileSize: 204800,
              mimeType: 'application/pdf',
              remarks: 'Official legal contract template for purchases',
            });
            const doc2 = this.documentRepo.create({
              property: p,
              documentCategory: 'Layout Plan',
              documentName: 'Floor_Plan_B1.pdf',
              filePath: '/uploads/documents/floor_plan_b1.pdf',
              fileSize: 512000,
              mimeType: 'application/pdf',
              remarks: 'Building block floor layouts and details',
            });
            await this.documentRepo.save([doc1, doc2]);
          }
        }
        this.logger.log('Seeded dummy media and documents successfully.');
      }
    }
  }
}
