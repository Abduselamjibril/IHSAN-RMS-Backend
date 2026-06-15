import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Property } from '../entities/property.entity';
import { PropertyType } from '../entities/property-type.entity';
import { Building } from '../entities/building.entity';
import { Floor } from '../entities/floor.entity';
import { Unit } from '../entities/unit.entity';
import { PropertyAmenity } from '../entities/property-amenity.entity';
import { AmenityMaster } from '../entities/amenity-master.entity';
import { PropertyMedia } from '../entities/property-media.entity';
import { PropertyDocument } from '../entities/property-document.entity';
import { FloorPlan } from '../entities/floor-plan.entity';
import { Site } from '../entities/site.entity';
import { PropertyTypesService } from './property-types.service';
import { AmenitiesService } from './amenities.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  CreateBuildingDto,
  UpdateBuildingDto,
  CreateFloorDto,
  UpdateFloorDto,
} from '../dto/property-crud.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(PropertyType)
    private readonly propertyTypeRepo: Repository<PropertyType>,
    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
    @InjectRepository(PropertyAmenity)
    private readonly propertyAmenityRepo: Repository<PropertyAmenity>,
    @InjectRepository(AmenityMaster)
    private readonly amenityRepo: Repository<AmenityMaster>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(PropertyMedia)
    private readonly mediaRepo: Repository<PropertyMedia>,
    @InjectRepository(PropertyDocument)
    private readonly documentRepo: Repository<PropertyDocument>,
    @InjectRepository(FloorPlan)
    private readonly floorPlanRepo: Repository<FloorPlan>,
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,

    private readonly propertyTypesService: PropertyTypesService,
    private readonly amenitiesService: AmenitiesService,
  ) {}

  async createProperty(dto: CreatePropertyDto): Promise<Property> {
    // Resolve PropertyType (with support for "Other" dynamic creation)
    let type: PropertyType;
    if (dto.propertyTypeName) {
      type = await this.propertyTypesService.findOrCreateByName(dto.propertyTypeName);
    } else if (dto.propertyTypeId) {
      const resolvedType = await this.propertyTypeRepo.findOne({ where: { id: dto.propertyTypeId } });
      if (!resolvedType) {
        throw new NotFoundException(`Property Type with ID ${dto.propertyTypeId} not found`);
      }
      type = resolvedType;
    } else {
      throw new ConflictException('Property Type ID or Property Type Name must be provided.');
    }

    // Auto-generate code if missing
    let code = dto.propertyCode;
    if (!code) {
      code = 'PROP-' + dto.propertyName.toUpperCase().replace(/[^A-Z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    }

    const checkExists = await this.propertyRepo.findOne({ where: { propertyCode: code } });
    if (checkExists) {
      throw new ConflictException(`Property with code ${code} already exists.`);
    }

    const property = this.propertyRepo.create({
      ...dto,
      propertyCode: code,
      propertyType: type,
    });

    const savedProperty = await this.propertyRepo.save(property);

    // Save Amenities mappings
    if (dto.amenityIds && dto.amenityIds.length > 0) {
      for (const amenityId of dto.amenityIds) {
        const amenity = await this.amenityRepo.findOne({ where: { id: amenityId } });
        if (amenity) {
          const mapping = this.propertyAmenityRepo.create({
            property: savedProperty,
            amenity,
          });
          await this.propertyAmenityRepo.save(mapping);
        }
      }
    }

    return savedProperty;
  }

  async findAllProperties(query: any): Promise<{ items: Property[]; total: number }> {
    const { page = 1, limit = 1000, search, city, status, propertyTypeId } = query;
    const qb = this.propertyRepo.createQueryBuilder('property')
      .leftJoinAndSelect('property.propertyType', 'propertyType')
      .where('property.isDeleted = :isDeleted', { isDeleted: false });

    if (search) {
      qb.andWhere('(property.propertyName ILIKE :search OR property.propertyCode ILIKE :search)', { search: `%${search}%` });
    }
    if (city) {
      qb.andWhere('property.city ILIKE :city', { city: `%${city}%` });
    }
    if (status) {
      qb.andWhere('property.propertyStatus = :status', { status });
    }
    if (propertyTypeId) {
      qb.andWhere('propertyType.id = :propertyTypeId', { propertyTypeId: +propertyTypeId });
    }

    qb.orderBy('property.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    if (items.length > 0) {
      const propertyIds = items.map((item) => +item.id);
      const allBuildings = await this.buildingRepo.find({
        where: { property: { id: In(propertyIds) }, isDeleted: false },
        relations: { property: true }
      });

      // Fetch floors for all buildings so cascading dropdowns work
      const buildingIds = allBuildings.map((b) => +b.id);
      let allFloors: Floor[] = [];
      let allUnits: Unit[] = [];
      if (buildingIds.length > 0) {
        allFloors = await this.floorRepo.find({
          where: { building: { id: In(buildingIds) }, isDeleted: false },
          relations: { building: true },
          order: { floorNumber: 'ASC' },
        });
        allUnits = await this.unitRepo.find({
          where: { building: { id: In(buildingIds) }, isDeleted: false },
          relations: { floor: true, unitStatus: true, unitType: true },
        });
      }

      // Fetch floor plans for all floors
      const floorIds = allFloors.map((f) => +f.id);
      let allFloorPlans: any[] = [];
      if (floorIds.length > 0) {
        allFloorPlans = await this.floorPlanRepo.find({
          where: { floor: { id: In(floorIds) } },
          relations: { floor: true },
          order: { uploadedAt: 'DESC' },
        });
      }

      const allMedia = await this.mediaRepo.find({
        where: { property: { id: In(propertyIds) } },
        relations: { property: true },
        order: { displayOrder: 'ASC' },
      });

      const allDocuments = await this.documentRepo.find({
        where: { property: { id: In(propertyIds) } },
        relations: { property: true },
        order: { uploadedAt: 'DESC' },
      });
      
      const plainItems = items.map((item) => {
        const plain = { ...item } as any;
        plain.media = allMedia
          .filter((m) => m.property && +m.property.id === +item.id)
          .map((m) => {
            const { property, ...mRest } = m;
            return mRest;
          });
        plain.documents = allDocuments
          .filter((d) => d.property && +d.property.id === +item.id)
          .map((d) => {
            const { property, ...dRest } = d;
            return dRest;
          });
        plain.buildings = allBuildings
          .filter((b) => b.property && +b.property.id === +item.id)
          .map((b) => {
            const { property, ...bRest } = b;
            // Attach floors to each building
            (bRest as any).floors = allFloors
              .filter((f) => f.building && +f.building.id === +b.id)
              .map((f) => {
                const { building, ...fRest } = f;
                // Attach units to each floor
                (fRest as any).units = allUnits
                  .filter((u) => u.floor && +u.floor.id === +f.id);
                // Attach floor plan to each floor
                (fRest as any).floorPlan = allFloorPlans.find((fp) => fp.floor && +fp.floor.id === +f.id) || null;
                return fRest;
              });
            return bRest;
          });
        return plain;
      });

      return { items: plainItems, total };
    }

    return { items, total };
  }

  async findOneProperty(id: number): Promise<any> {
    const property = await this.propertyRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found.`);
    }

    const buildings = await this.buildingRepo.find({
      where: { property: { id }, isDeleted: false },
      order: { buildingName: 'ASC' },
    });

    // Attach floors to each building
    for (const b of buildings) {
      const floors = await this.floorRepo.find({
        where: { building: { id: b.id }, isDeleted: false },
        order: { floorNumber: 'ASC' },
      });
      const units = await this.unitRepo.find({
        where: { building: { id: b.id }, isDeleted: false },
        relations: { floor: true, unitStatus: true, unitType: true },
      });
      for (const f of floors) {
        (f as any).units = units.filter((u) => u.floor && +u.floor.id === +f.id);
        const floorPlan = await this.floorPlanRepo.findOne({
          where: { floor: { id: f.id } },
          order: { uploadedAt: 'DESC' }
        });
        (f as any).floorPlan = floorPlan || null;
      }
      (b as any).floors = floors;
    }

    const sites = await this.siteRepo.find({
      where: { property: { id }, isDeleted: false },
      order: { siteName: 'ASC' },
    });

    const groupedSites = sites.map((site) => {
      const siteBuildings = buildings.filter((b) => b.site && +b.site.id === +site.id);
      return {
        ...site,
        buildings: siteBuildings,
      };
    });

    const unassignedBuildings = buildings.filter((b) => !b.site);

    const propAmenities = await this.propertyAmenityRepo.find({
      where: { property: { id } },
      relations: { amenity: true },
    });
    const amenities = propAmenities.map((pa) => pa.amenity);

    const media = await this.mediaRepo.find({
      where: { property: { id } },
      order: { displayOrder: 'ASC' },
    });

    const documents = await this.documentRepo.find({
      where: { property: { id } },
      order: { uploadedAt: 'DESC' },
    });

    return {
      ...property,
      buildings,
      sites: groupedSites,
      unassignedBuildings,
      amenities,
      media,
      documents,
    };
  }

  async updateProperty(id: number, dto: UpdatePropertyDto): Promise<Property> {
    const property = await this.propertyRepo.findOne({ where: { id, isDeleted: false } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found.`);
    }

    if (dto.propertyTypeName) {
      property.propertyType = await this.propertyTypesService.findOrCreateByName(dto.propertyTypeName);
    } else if (dto.propertyTypeId) {
      const type = await this.propertyTypeRepo.findOne({ where: { id: dto.propertyTypeId } });
      if (!type) {
        throw new NotFoundException(`Property Type with ID ${dto.propertyTypeId} not found`);
      }
      property.propertyType = type;
    }

    Object.assign(property, dto);
    const updated = await this.propertyRepo.save(property);

    if (dto.amenityIds) {
      // Clear old mappings
      await this.propertyAmenityRepo.delete({ property: { id } });
      // Insert new ones
      for (const amenityId of dto.amenityIds) {
        const amenity = await this.amenityRepo.findOne({ where: { id: amenityId } });
        if (amenity) {
          const mapping = this.propertyAmenityRepo.create({
            property: updated,
            amenity,
          });
          await this.propertyAmenityRepo.save(mapping);
        }
      }
    }

    return updated;
  }

  async removeProperty(id: number): Promise<void> {
    const property = await this.propertyRepo.findOne({ where: { id, isDeleted: false } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found.`);
    }
    property.isDeleted = true;
    await this.propertyRepo.save(property);
  }

  // --- Building Methods ---

  async createBuilding(dto: CreateBuildingDto): Promise<Building> {
    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId, isDeleted: false } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found.`);
    }

    const checkExists = await this.buildingRepo.findOne({ where: { buildingCode: dto.buildingCode } });
    if (checkExists) {
      throw new ConflictException(`Building with code ${dto.buildingCode} already exists.`);
    }

    let site: Site | null = null;
    if (dto.siteId) {
      site = await this.siteRepo.findOne({ where: { id: dto.siteId, isDeleted: false } });
      if (!site) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
      }
    }

    const building = this.buildingRepo.create({
      ...dto,
      property,
      site,
    });
    const saved = await this.buildingRepo.save(building);

    // Increment total buildings in property
    property.totalBuildings += 1;
    await this.propertyRepo.save(property);

    return saved;
  }

  async updateBuilding(id: number, dto: UpdateBuildingDto): Promise<Building> {
    const building = await this.buildingRepo.findOne({ where: { id, isDeleted: false } });
    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found.`);
    }

    if (dto.siteId !== undefined) {
      if (dto.siteId === null) {
        building.site = null;
      } else {
        const site = await this.siteRepo.findOne({ where: { id: dto.siteId, isDeleted: false } });
        if (!site) {
          throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
        }
        building.site = site;
      }
    }

    const { siteId, ...updateFields } = dto;
    Object.assign(building, updateFields);
    return this.buildingRepo.save(building);
  }

  async removeBuilding(id: number): Promise<void> {
    const building = await this.buildingRepo.findOne({ where: { id, isDeleted: false } });
    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found.`);
    }
    building.isDeleted = true;
    await this.buildingRepo.save(building);

    // Decrement total buildings
    const property = await this.propertyRepo.findOne({ where: { id: building.property.id } });
    if (property) {
      property.totalBuildings = Math.max(0, property.totalBuildings - 1);
      await this.propertyRepo.save(property);
    }
  }

  async findOneBuilding(id: number): Promise<Building & { floors: Floor[] }> {
    const building = await this.buildingRepo.findOne({ where: { id, isDeleted: false } });
    if (!building) {
      throw new NotFoundException(`Building with ID ${id} not found.`);
    }
    const floors = await this.floorRepo.find({
      where: { building: { id }, isDeleted: false },
      order: { floorNumber: 'ASC' },
    });
    return { ...building, floors };
  }

  // --- Floor Methods ---

  async createFloor(dto: CreateFloorDto): Promise<Floor> {
    const building = await this.buildingRepo.findOne({ where: { id: dto.buildingId, isDeleted: false } });
    if (!building) {
      throw new NotFoundException(`Building with ID ${dto.buildingId} not found.`);
    }

    const checkExists = await this.floorRepo.findOne({
      where: { building: { id: dto.buildingId }, floorNumber: dto.floorNumber, isDeleted: false },
    });
    if (checkExists) {
      throw new ConflictException(`Floor ${dto.floorNumber} already exists in building ${building.buildingName}.`);
    }

    const floor = this.floorRepo.create({
      ...dto,
      building,
    });
    const saved = await this.floorRepo.save(floor);

    // Update building total floors count
    building.totalFloors += 1;
    await this.buildingRepo.save(building);

    return saved;
  }

  async updateFloor(id: number, dto: UpdateFloorDto): Promise<Floor> {
    const floor = await this.floorRepo.findOne({ where: { id, isDeleted: false } });
    if (!floor) {
      throw new NotFoundException(`Floor with ID ${id} not found.`);
    }
    Object.assign(floor, dto);
    return this.floorRepo.save(floor);
  }

  async removeFloor(id: number): Promise<void> {
    const floor = await this.floorRepo.findOne({ where: { id, isDeleted: false } });
    if (!floor) {
      throw new NotFoundException(`Floor with ID ${id} not found.`);
    }
    floor.isDeleted = true;
    await this.floorRepo.save(floor);

    const building = await this.buildingRepo.findOne({ where: { id: floor.building.id } });
    if (building) {
      building.totalFloors = Math.max(0, building.totalFloors - 1);
      await this.buildingRepo.save(building);
    }
  }
}
