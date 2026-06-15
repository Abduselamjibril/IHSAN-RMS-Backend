import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitPrice } from '../entities/unit-price.entity';
import { UnitPriceHistory } from '../entities/unit-price-history.entity';
import { PricePromotion } from '../entities/price-promotion.entity';
import { Unit } from '../entities/unit.entity';
import { Property } from '../entities/property.entity';
import { UnitType } from '../entities/unit-type.entity';
import { CreateUnitPriceDto, CreatePromotionDto } from '../dto/unit-crud.dto';

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
  ) {}

  async createUnitPrice(dto: CreateUnitPriceDto): Promise<UnitPrice> {
    const unit = await this.unitRepo.findOne({ where: { id: dto.unitId, isDeleted: false } });
    if (!unit) throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);

    // Find current active price
    const currentActive = await this.unitPriceRepo.findOne({
      where: { unit: { id: dto.unitId }, isActive: true },
    });

    let oldPrice = 0;
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
      isActive: true,
    });
    const savedPrice = await this.unitPriceRepo.save(price);

    // Update unit's current price
    unit.currentPrice = base;
    await this.unitRepo.save(unit);

    // Write pricing history
    const history = this.unitPriceHistoryRepo.create({
      unitPrice: savedPrice,
      oldPrice,
      newPrice: base,
      changeReason: dto.remarks || 'Active unit price updated',
    });
    await this.unitPriceHistoryRepo.save(history);

    return savedPrice;
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
}
