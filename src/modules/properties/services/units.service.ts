import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Unit } from '../entities/unit.entity';
import { UnitType } from '../entities/unit-type.entity';
import { UnitStatus } from '../entities/unit-status.entity';
import { UnitStatusHistory } from '../entities/unit-status-history.entity';
import { Property } from '../entities/property.entity';
import { Building } from '../entities/building.entity';
import { Floor } from '../entities/floor.entity';
import { UnitPrice } from '../entities/unit-price.entity';
import { PropertyMedia } from '../entities/property-media.entity';
import { UnitImportLog } from '../entities/unit-import-log.entity';
import { UnitTypesService } from './unit-types.service';
import { CreateUnitDto, UpdateUnitDto, UpdateUnitStatusDto } from '../dto/unit-crud.dto';

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(UnitType)
    private readonly unitTypeRepo: Repository<UnitType>,
    @InjectRepository(UnitStatus)
    private readonly unitStatusRepo: Repository<UnitStatus>,
    @InjectRepository(UnitStatusHistory)
    private readonly unitStatusHistoryRepo: Repository<UnitStatusHistory>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,
    @InjectRepository(Floor)
    private readonly floorRepo: Repository<Floor>,
    @InjectRepository(UnitPrice)
    private readonly unitPriceRepo: Repository<UnitPrice>,
    @InjectRepository(PropertyMedia)
    private readonly propertyMediaRepo: Repository<PropertyMedia>,
    @InjectRepository(UnitImportLog)
    private readonly logRepo: Repository<UnitImportLog>,

    private readonly unitTypesService: UnitTypesService,
    private readonly dataSource: DataSource,
  ) {}

  async createUnit(dto: CreateUnitDto): Promise<Unit> {
    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId, isDeleted: false } });
    if (!property) throw new NotFoundException(`Property with ID ${dto.propertyId} not found.`);

    const building = await this.buildingRepo.findOne({ where: { id: dto.buildingId, isDeleted: false } });
    if (!building) throw new NotFoundException(`Building with ID ${dto.buildingId} not found.`);

    const floor = await this.floorRepo.findOne({ where: { id: dto.floorId, isDeleted: false } });
    if (!floor) throw new NotFoundException(`Floor with ID ${dto.floorId} not found.`);

    // Resolve UnitType (with dynamic inline creation)
    let type: UnitType;
    if (dto.unitTypeName) {
      type = await this.unitTypesService.findOrCreateByName(dto.unitTypeName);
    } else if (dto.unitTypeId) {
      const resolvedType = await this.unitTypeRepo.findOne({ where: { id: dto.unitTypeId } });
      if (!resolvedType) throw new NotFoundException(`Unit Type with ID ${dto.unitTypeId} not found.`);
      type = resolvedType;
    } else {
      throw new BadRequestException('Unit Type ID or Unit Type Name is required.');
    }

    // Resolve UnitStatus (default: Available)
    let status: UnitStatus;
    const statusId = dto.unitStatusId;
    if (statusId) {
      const resolvedStatus = await this.unitStatusRepo.findOne({ where: { id: statusId } });
      if (!resolvedStatus) throw new NotFoundException(`Unit Status with ID ${statusId} not found.`);
      status = resolvedStatus;
    } else {
      const resolvedStatus = await this.unitStatusRepo.findOne({ where: { statusName: 'Available' } });
      if (!resolvedStatus) throw new NotFoundException('Default status "Available" not found in master list.');
      status = resolvedStatus;
    }

    const checkExists = await this.unitRepo.findOne({
      where: { floor: { id: dto.floorId }, unitNumber: dto.unitNumber, isDeleted: false },
    });
    if (checkExists) {
      throw new ConflictException(`Unit with number ${dto.unitNumber} already exists on floor ${floor.floorNumber}.`);
    }

    // Auto-generate code
    let code = dto.unitCode;
    if (!code) {
      code = `${property.propertyCode}-${building.buildingCode}-${floor.floorNumber}-${dto.unitNumber}`.toUpperCase().replace(/\s+/g, '-');
    }

    const unit = this.unitRepo.create({
      ...dto,
      unitCode: code,
      property,
      building,
      floor,
      unitType: type,
      unitStatus: status,
    });

    const savedUnit = await this.unitRepo.save(unit);

    // Update totals
    property.totalUnits += 1;
    await this.propertyRepo.save(property);

    building.totalUnits += 1;
    await this.buildingRepo.save(building);

    floor.totalUnits += 1;
    await this.floorRepo.save(floor);

    // Create initial status history entry
    const history = this.unitStatusHistoryRepo.create({
      unit: savedUnit,
      newStatus: status,
      reason: 'Initial unit creation',
    });
    await this.unitStatusHistoryRepo.save(history);

    return savedUnit;
  }

  async findAllUnits(query: any): Promise<{ items: Unit[]; total: number }> {
    const { page = 1, limit = 10, search, propertyId, buildingId, floorId, statusId, unitStatusId, unitTypeId, minPrice, maxPrice, bedrooms, minArea } = query;
    const qb = this.unitRepo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.property', 'property')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('unit.floor', 'floor')
      .leftJoinAndSelect('unit.unitType', 'unitType')
      .leftJoinAndSelect('unit.unitStatus', 'unitStatus')
      .where('unit.isDeleted = :isDeleted', { isDeleted: false });

    if (search) {
      qb.andWhere('(unit.unitNumber ILIKE :search OR unit.unitCode ILIKE :search OR unit.title ILIKE :search)', { search: `%${search}%` });
    }
    if (propertyId) {
      qb.andWhere('property.id = :propertyId', { propertyId: +propertyId });
    }
    if (buildingId) {
      qb.andWhere('building.id = :buildingId', { buildingId: +buildingId });
    }
    if (floorId) {
      qb.andWhere('floor.id = :floorId', { floorId: +floorId });
    }
    const resolvedStatusId = unitStatusId || statusId;
    if (resolvedStatusId) {
      qb.andWhere('unitStatus.id = :statusId', { statusId: +resolvedStatusId });
    }
    if (unitTypeId) {
      qb.andWhere('unitType.id = :unitTypeId', { unitTypeId: +unitTypeId });
    }
    if (minPrice) {
      qb.andWhere('unit.currentPrice >= :minPrice', { minPrice });
    }
    if (maxPrice) {
      qb.andWhere('unit.currentPrice <= :maxPrice', { maxPrice });
    }
    if (bedrooms) {
      qb.andWhere('unit.bedroomCount = :bedrooms', { bedrooms });
    }
    if (minArea) {
      qb.andWhere('unit.grossArea >= :minArea', { minArea });
    }

    qb.orderBy('unit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOneUnit(id: number): Promise<Unit & { pricingHistory: UnitPrice[]; statusHistory: UnitStatusHistory[]; media: PropertyMedia[] }> {
    const unit = await this.unitRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found.`);
    }

    const pricingHistory = await this.unitPriceRepo.find({
      where: { unit: { id } },
      order: { createdAt: 'DESC' },
    });

    const statusHistory = await this.unitStatusHistoryRepo.find({
      where: { unit: { id } },
      relations: { oldStatus: true, newStatus: true },
      order: { changedAt: 'DESC' },
    });

    const media = await this.propertyMediaRepo.find({
      where: { property: { id: unit.property.id } },
      order: { displayOrder: 'ASC' },
    });

    return {
      ...unit,
      pricingHistory,
      statusHistory,
      media,
    };
  }

  async updateUnit(id: number, dto: UpdateUnitDto): Promise<Unit> {
    const unit = await this.unitRepo.findOne({ where: { id, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${id} not found.`);

    if (dto.unitTypeName) {
      unit.unitType = await this.unitTypesService.findOrCreateByName(dto.unitTypeName);
    } else if (dto.unitTypeId) {
      const type = await this.unitTypeRepo.findOne({ where: { id: dto.unitTypeId } });
      if (!type) throw new NotFoundException(`Unit Type with ID ${dto.unitTypeId} not found.`);
      unit.unitType = type;
    }

    if (dto.unitStatusId) {
      const status = await this.unitStatusRepo.findOne({ where: { id: dto.unitStatusId } });
      if (!status) throw new NotFoundException(`Unit Status with ID ${dto.unitStatusId} not found.`);
      unit.unitStatus = status;
    }

    Object.assign(unit, dto);
    return this.unitRepo.save(unit);
  }

  async removeUnit(id: number): Promise<void> {
    const unit = await this.unitRepo.findOne({ where: { id, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${id} not found.`);

    unit.isDeleted = true;
    await this.unitRepo.save(unit);

    // Decrement counts
    const property = await this.propertyRepo.findOne({ where: { id: unit.property.id } });
    if (property) {
      property.totalUnits = Math.max(0, property.totalUnits - 1);
      await this.propertyRepo.save(property);
    }

    const building = await this.buildingRepo.findOne({ where: { id: unit.building.id } });
    if (building) {
      building.totalUnits = Math.max(0, building.totalUnits - 1);
      await this.buildingRepo.save(building);
    }

    const floor = await this.floorRepo.findOne({ where: { id: unit.floor.id } });
    if (floor) {
      floor.totalUnits = Math.max(0, floor.totalUnits - 1);
      await this.floorRepo.save(floor);
    }
  }

  // --- Dynamic Status Transition Workflow ---

  async transitionStatus(id: number, dto: UpdateUnitStatusDto): Promise<Unit> {
    const unit = await this.unitRepo.findOne({ where: { id, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${id} not found.`);

    const oldStatus = unit.unitStatus;
    let newStatus: UnitStatus;

    if (dto.statusId) {
      const resolvedStatus = await this.unitStatusRepo.findOne({ where: { id: dto.statusId } });
      if (!resolvedStatus) throw new NotFoundException('Requested Unit Status not found.');
      newStatus = resolvedStatus;
    } else if (dto.statusName) {
      const resolvedStatus = await this.unitStatusRepo.findOne({ where: { statusName: dto.statusName } });
      if (!resolvedStatus) throw new NotFoundException('Requested Unit Status not found.');
      newStatus = resolvedStatus;
    } else {
      throw new BadRequestException('Status ID or Status Name is required for transition.');
    }

    // Status transition rules checks
    if (oldStatus.statusName === 'Sold' && newStatus.statusName !== 'Sold') {
      // Reverting a sold unit requires manager bypass confirmation or explicit reason
      if (!dto.reason || !dto.reason.toLowerCase().includes('approved')) {
        throw new BadRequestException('Reverting a sold unit requires approval reason.');
      }
    }

    // Reservation locks
    if (newStatus.statusName === 'Reserved') {
      const hours = dto.reservationExpiryHours || 24;
      unit.reservationExpiry = new Date(Date.now() + hours * 60 * 60 * 1000);
    } else {
      unit.reservationExpiry = null;
    }

    if (newStatus.statusName === 'Sold') {
      unit.soldDate = new Date();
    } else if (oldStatus.statusName === 'Sold') {
      unit.soldDate = null;
    }

    unit.unitStatus = newStatus;
    const saved = await this.unitRepo.save(unit);

    // Save history
    const history = this.unitStatusHistoryRepo.create({
      unit: saved,
      oldStatus,
      newStatus,
      reason: dto.reason || 'Status transitioned via API request',
    });
    await this.unitStatusHistoryRepo.save(history);

    return saved;
  }

  async getStatusHistory(): Promise<UnitStatusHistory[]> {
    return this.unitStatusHistoryRepo.find({
      relations: {
        unit: {
          property: true,
        },
        oldStatus: true,
        newStatus: true,
      },
      order: { changedAt: 'DESC' },
    });
  }

  // --- Bulk CSV Import inside Transaction ---

  async bulkImportCsv(fileName: string, fileContent: string): Promise<UnitImportLog> {
    const importRef = 'IMP-' + Date.now();
    const rows = fileContent.split('\n').map((r) => r.trim()).filter((r) => r.length > 0);
    if (rows.length < 2) {
      throw new BadRequestException('Uploaded CSV file is empty or missing content.');
    }

    const headers = rows[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const dataRows = rows.slice(1);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const cols = dataRows[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < headers.length) continue;

          // Parse columns based on standard CSV columns:
          // property_code, building_code, floor_number, unit_number, unit_type_name, bedroom_count, bathroom_count, area, base_price
          const rowData: any = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx];
          });

          // Fetch lookups
          const property = await queryRunner.manager.findOne(Property, {
            where: { propertyCode: rowData.property_code, isDeleted: false },
          });
          if (!property) throw new Error(`Property code ${rowData.property_code} not found.`);

          const building = await queryRunner.manager.findOne(Building, {
            where: { buildingCode: rowData.building_code, property: { id: property.id }, isDeleted: false },
          });
          if (!building) throw new Error(`Building code ${rowData.building_code} not found under property ${property.propertyName}.`);

          const floor = await queryRunner.manager.findOne(Floor, {
            where: { building: { id: building.id }, floorNumber: parseInt(rowData.floor_number), isDeleted: false },
          });
          if (!floor) throw new Error(`Floor number ${rowData.floor_number} not found under building ${building.buildingName}.`);

          let unitType = await queryRunner.manager.findOne(UnitType, {
            where: { typeName: rowData.unit_type_name },
          });
          if (!unitType) {
            // Dynamic inline create
            unitType = queryRunner.manager.create(UnitType, {
              typeName: rowData.unit_type_name,
              description: 'Imported dynamically',
            });
            unitType = await queryRunner.manager.save(UnitType, unitType);
          }

          const availableStatus = await queryRunner.manager.findOne(UnitStatus, {
            where: { statusName: 'Available' },
          });
          if (!availableStatus) throw new Error('Default Available status not found.');

          // Check duplicate
          const dup = await queryRunner.manager.findOne(Unit, {
            where: { floor: { id: floor.id }, unitNumber: rowData.unit_number, isDeleted: false },
          });
          if (dup) throw new Error(`Unit ${rowData.unit_number} already exists on floor ${floor.floorNumber}.`);

          const unitCode = `${property.propertyCode}-${building.buildingCode}-${floor.floorNumber}-${rowData.unit_number}`.toUpperCase().replace(/\s+/g, '-');

          const unit = queryRunner.manager.create(Unit, {
            property,
            building,
            floor,
            unitType,
            unitStatus: availableStatus,
            unitCode,
            unitNumber: rowData.unit_number,
            title: `${property.propertyName} - Unit ${rowData.unit_number}`,
            bedroomCount: parseInt(rowData.bedroom_count) || 0,
            bathroomCount: parseInt(rowData.bathroom_count) || 0,
            grossArea: parseFloat(rowData.area) || 0,
            currentPrice: parseFloat(rowData.base_price) || 0,
          });

          const saved = await queryRunner.manager.save(Unit, unit);

          // Seed default pricing
          if (rowData.base_price) {
            const price = queryRunner.manager.create(UnitPrice, {
              unit: saved,
              basePrice: parseFloat(rowData.base_price),
              finalPrice: parseFloat(rowData.base_price),
              effectiveFrom: new Date(),
              isActive: true,
            });
            await queryRunner.manager.save(UnitPrice, price);
          }

          // Update counts
          property.totalUnits += 1;
          await queryRunner.manager.save(Property, property);
          building.totalUnits += 1;
          await queryRunner.manager.save(Building, building);
          floor.totalUnits += 1;
          await queryRunner.manager.save(Floor, floor);

          successful++;
        } catch (rowErr) {
          failed++;
          errors.push(`Row ${i + 2} failed: ${rowErr.message}`);
        }
      }

      if (failed > 0 && successful === 0) {
        throw new Error('All rows failed to import.');
      }

      await queryRunner.commitTransaction();
    } catch (txErr) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bulk Import Transaction aborted and rolled back. Error: ' + txErr.message);
      errors.push('Transaction rolled back: ' + txErr.message);
    } finally {
      await queryRunner.release();
    }

    const log = this.logRepo.create({
      importReference: importRef,
      importedFileName: fileName,
      totalRecords: dataRows.length,
      successfulRecords: successful,
      failedRecords: failed,
      importStatus: failed === 0 ? 'Success' : successful > 0 ? 'Partial Success' : 'Failed',
      errorLog: errors.join('\n'),
    });

    return this.logRepo.save(log);
  }
}
