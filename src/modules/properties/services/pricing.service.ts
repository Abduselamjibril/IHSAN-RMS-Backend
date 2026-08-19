import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitPrice } from '../entities/unit-price.entity';
import { UnitPriceHistory } from '../entities/unit-price-history.entity';
import { PricePromotion } from '../entities/price-promotion.entity';
import { Unit } from '../entities/unit.entity';
import { Property } from '../entities/property.entity';
import { UnitType } from '../entities/unit-type.entity';
import { PriceChangeRequest } from '../entities/price-change-request.entity';
import {
  CreateUnitPriceDto,
  CreatePromotionDto,
  CreatePriceChangeRequestDto,
} from '../dto/unit-crud.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(UnitPrice)
    private readonly unitPriceRepo: Repository<UnitPrice>,
    @InjectRepository(UnitPriceHistory)
    private readonly unitPriceHistoryRepo: Repository<UnitPriceHistory>,
    @InjectRepository(PricePromotion)
    private readonly promotionRepo: Repository<PricePromotion>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(UnitType)
    private readonly unitTypeRepo: Repository<UnitType>,
    @InjectRepository(PriceChangeRequest)
    private readonly priceChangeRepo: Repository<PriceChangeRequest>,
  ) {}

  async createUnitPrice(dto: CreateUnitPriceDto, user?: any): Promise<UnitPrice> {
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);

    // Find current active price
    const currentActive = await this.unitPriceRepo.findOne({
      where: { unit: { id: dto.unitId }, isActive: true },
    });

    let oldPrice = unit.currentPrice ? Number(unit.currentPrice) : 0;
    if (currentActive) {
      oldPrice = Number(currentActive.basePrice);
      currentActive.isActive = false;
      currentActive.effectiveTo = new Date();
      await this.unitPriceRepo.save(currentActive);
    }

    // Calculate final price (base price - discount if any)
    const tax = dto.taxPercentage || 0;
    const discount = dto.discountPercentage || 0;
    const base = Number(dto.basePrice);
    const finalPrice = base * (1 - discount / 100) * (1 + tax / 100);

    const price = this.unitPriceRepo.create({
      ...dto,
      unit,
      finalPrice,
      isNegotiable: dto.isNegotiable ?? false,
      isActive: true,
      createdBy: user?.userId || 1,
    });
    const savedPrice = await this.unitPriceRepo.save(price);

    // Update unit's current price & negotiable flag
    unit.currentPrice = base;
    if (dto.isNegotiable !== undefined) {
      unit.isNegotiable = dto.isNegotiable;
    }
    if (dto.currencyCode) {
      unit.currencyCode = dto.currencyCode;
    }
    await this.unitRepo.save(unit);

    // Write immutable pricing history
    const history = this.unitPriceHistoryRepo.create({
      unit,
      unitPrice: savedPrice,
      oldPrice,
      newPrice: base,
      currencyCode: dto.currencyCode || 'ETB',
      isNegotiable: !!dto.isNegotiable,
      changeReason: dto.remarks || 'Active unit price updated',
      changedBy: user?.userId || 1,
      changedByName: user?.fullName || 'System Administrator',
    });
    await this.unitPriceHistoryRepo.save(history);

    return savedPrice;
  }

  async getUnitPriceHistory(unitId: number): Promise<UnitPriceHistory[]> {
    return this.unitPriceHistoryRepo.createQueryBuilder('history')
      .leftJoinAndSelect('history.unit', 'unit')
      .leftJoinAndSelect('history.unitPrice', 'unitPrice')
      .where('history.unit.id = :unitId OR unitPrice.unit.id = :unitId', { unitId })
      .orderBy('history.changedAt', 'DESC')
      .getMany();
  }

  async createPriceChangeRequest(dto: CreatePriceChangeRequestDto, user?: any): Promise<PriceChangeRequest> {
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);

    const currentPrice = unit.currentPrice ? Number(unit.currentPrice) : 0;
    const request = this.priceChangeRepo.create({
      unit,
      currentPrice,
      proposedPrice: Number(dto.proposedPrice),
      currencyCode: dto.currencyCode || 'ETB',
      isNegotiable: dto.isNegotiable ?? unit.isNegotiable ?? false,
      reason: dto.reason,
      status: 'PENDING',
      requestedBy: user?.userId || 1,
      requestedByName: user?.fullName || 'Sales Executive',
    });

    return this.priceChangeRepo.save(request);
  }

  async getPriceChangeRequests(status?: string): Promise<PriceChangeRequest[]> {
    const query = this.priceChangeRepo.createQueryBuilder('request')
      .leftJoinAndSelect('request.unit', 'unit')
      .leftJoinAndSelect('unit.property', 'property')
      .leftJoinAndSelect('unit.building', 'building')
      .leftJoinAndSelect('unit.floor', 'floor')
      .orderBy('request.requestedAt', 'DESC');

    if (status) {
      query.where('request.status = :status', { status: status.toUpperCase() });
    }

    return query.getMany();
  }

  async approvePriceChangeRequest(id: number, user?: any, comment?: string): Promise<PriceChangeRequest> {
    const request = await this.priceChangeRepo.findOne({
      where: { id },
      relations: { unit: true },
    });
    if (!request) throw new NotFoundException(`Price change request #${id} not found.`);
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request #${id} is already processed (${request.status}).`);
    }

    request.status = 'APPROVED';
    request.reviewedBy = user?.userId || 1;
    request.reviewedByName = user?.fullName || 'Property Manager';
    request.reviewedAt = new Date();
    request.reviewComment = comment || 'Approved by management';
    const savedRequest = await this.priceChangeRepo.save(request);

    // Apply the price change to the Unit
    const unit = request.unit;
    const oldPrice = unit.currentPrice ? Number(unit.currentPrice) : 0;
    const newPrice = Number(request.proposedPrice);

    unit.currentPrice = newPrice;
    unit.isNegotiable = !!request.isNegotiable;
    unit.currencyCode = request.currencyCode || 'ETB';
    await this.unitRepo.save(unit);

    // Create unit price record
    const price = this.unitPriceRepo.create({
      unit,
      basePrice: newPrice,
      finalPrice: newPrice,
      currencyCode: request.currencyCode || 'ETB',
      isNegotiable: !!request.isNegotiable,
      effectiveFrom: new Date(),
      isActive: true,
      remarks: `Applied from approved Price Change Request #${request.id}`,
      createdBy: user?.userId || 1,
    });
    const savedPrice = await this.unitPriceRepo.save(price);

    // Write pricing history
    const history = this.unitPriceHistoryRepo.create({
      unit,
      unitPrice: savedPrice,
      oldPrice,
      newPrice,
      currencyCode: request.currencyCode || 'ETB',
      isNegotiable: !!request.isNegotiable,
      changeReason: `Approval ref #${request.id}: ${comment || request.reason}`,
      changedBy: user?.userId || 1,
      changedByName: user?.fullName || 'Property Manager',
    });
    await this.unitPriceHistoryRepo.save(history);

    return savedRequest;
  }

  async rejectPriceChangeRequest(id: number, user?: any, comment?: string): Promise<PriceChangeRequest> {
    const request = await this.priceChangeRepo.findOne({ where: { id }, relations: { unit: true } });
    if (!request) throw new NotFoundException(`Price change request #${id} not found.`);
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request #${id} is already processed (${request.status}).`);
    }

    request.status = 'REJECTED';
    request.reviewedBy = user?.userId || 1;
    request.reviewedByName = user?.fullName || 'Property Manager';
    request.reviewedAt = new Date();
    request.reviewComment = comment || 'Rejected by management';

    return this.priceChangeRepo.save(request);
  }

  async createPromotion(dto: CreatePromotionDto): Promise<PricePromotion> {
    let property: Property | null = null;
    if (dto.applicablePropertyId) {
      property = await this.propertyRepo.findOne({ where: { id: dto.applicablePropertyId, isDeleted: false } });
    }

    let unitType: UnitType | null = null;
    if (dto.applicableUnitTypeId) {
      unitType = await this.unitTypeRepo.findOne({ where: { id: dto.applicableUnitTypeId } });
    }

    const promo = this.promotionRepo.create({
      ...dto,
      applicableProperty: property,
      applicableUnitType: unitType,
    } as any);
    return this.promotionRepo.save(promo as any);
  }

  async getActivePromotions(): Promise<PricePromotion[]> {
    const today = new Date();
    return this.promotionRepo.createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.applicableProperty', 'property')
      .leftJoinAndSelect('promotion.applicableUnitType', 'unitType')
      .where('promotion.isActive = :isActive', { isActive: true })
      .andWhere('(promotion.startDate <= :today OR promotion.startDate IS NULL)', { today })
      .andWhere('(promotion.endDate >= :today OR promotion.endDate IS NULL)', { today })
      .getMany();
  }

  async getAllPromotions(): Promise<PricePromotion[]> {
    return this.promotionRepo.find({
      relations: {
        applicableProperty: true,
        applicableUnitType: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async updatePromotion(id: number, dto: CreatePromotionDto): Promise<PricePromotion> {
    const promotion = await this.promotionRepo.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException(`Promotion with ID ${id} not found.`);

    let property: Property | null = null;
    if (dto.applicablePropertyId !== undefined) {
      if (dto.applicablePropertyId) {
        property = await this.propertyRepo.findOne({ where: { id: dto.applicablePropertyId, isDeleted: false } });
        if (!property) throw new NotFoundException(`Property with ID ${dto.applicablePropertyId} not found.`);
      }
      promotion.applicableProperty = property as any;
    }

    let unitType: UnitType | null = null;
    if (dto.applicableUnitTypeId !== undefined) {
      if (dto.applicableUnitTypeId) {
        unitType = await this.unitTypeRepo.findOne({ where: { id: dto.applicableUnitTypeId } });
        if (!unitType) throw new NotFoundException(`Unit Type with ID ${dto.applicableUnitTypeId} not found.`);
      }
      promotion.applicableUnitType = unitType as any;
    }

    if (dto.promotionName !== undefined) promotion.promotionName = dto.promotionName;
    if (dto.promotionType !== undefined) promotion.promotionType = dto.promotionType;
    if (dto.discountPercentage !== undefined) promotion.discountPercentage = dto.discountPercentage;
    if (dto.fixedDiscountAmount !== undefined) promotion.fixedDiscountAmount = dto.fixedDiscountAmount;
    if (dto.startDate !== undefined) promotion.startDate = dto.startDate;
    if (dto.endDate !== undefined) promotion.endDate = dto.endDate;
    if (dto.remarks !== undefined) promotion.remarks = dto.remarks;

    return this.promotionRepo.save(promotion);
  }

  async deactivatePromotion(id: number): Promise<PricePromotion> {
    const promotion = await this.promotionRepo.findOne({ where: { id } });
    if (!promotion) throw new NotFoundException(`Promotion with ID ${id} not found.`);

    promotion.isActive = false;
    promotion.endDate = new Date(); // Instant termination timestamp
    return this.promotionRepo.save(promotion);
  }
}
