import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../entities/unit.entity';
import { Property } from '../entities/property.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
  ) {}

  async getInventoryStatistics(): Promise<any> {
    const rawStats = await this.unitRepo.createQueryBuilder('unit')
      .leftJoin('unit.unitStatus', 'status')
      .select('status.statusName', 'status')
      .addSelect('COUNT(unit.id)', 'count')
      .addSelect('SUM(unit.currentPrice)', 'totalValue')
      .where('unit.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('status.statusName')
      .getRawMany();

    const statsMap: any = {
      Available: { count: 0, value: 0 },
      Reserved: { count: 0, value: 0 },
      Sold: { count: 0, value: 0 },
      Blocked: { count: 0, value: 0 },
      Maintenance: { count: 0, value: 0 },
    };

    let totalCount = 0;
    let totalValuation = 0;

    rawStats.forEach((stat) => {
      const statusName = stat.status;
      const count = parseInt(stat.count) || 0;
      const value = parseFloat(stat.totalValue) || 0;

      totalCount += count;
      totalValuation += value;

      if (statsMap[statusName]) {
        statsMap[statusName] = { count, value };
      } else {
        statsMap[statusName] = { count, value };
      }
    });

    // Compute availability by property
    const propertyStats = await this.unitRepo.createQueryBuilder('unit')
      .leftJoin('unit.property', 'property')
      .leftJoin('unit.unitStatus', 'status')
      .select('property.propertyName', 'propertyName')
      .addSelect('property.propertyCode', 'propertyCode')
      .addSelect('status.statusName', 'status')
      .addSelect('COUNT(unit.id)', 'count')
      .where('unit.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('property.id')
      .addGroupBy('property.propertyName')
      .addGroupBy('property.propertyCode')
      .addGroupBy('status.statusName')
      .getRawMany();

    const propertyMap: any = {};
    propertyStats.forEach((row) => {
      const code = row.propertyCode;
      const name = row.propertyName;
      const statusName = row.status;
      const count = parseInt(row.count) || 0;

      if (!propertyMap[code]) {
        propertyMap[code] = {
          propertyCode: code,
          propertyName: name,
          total: 0,
          Available: 0,
          Reserved: 0,
          Sold: 0,
          Blocked: 0,
        };
      }

      propertyMap[code].total += count;
      if (propertyMap[code][statusName] !== undefined) {
        propertyMap[code][statusName] = count;
      } else {
        propertyMap[code][statusName] = count;
      }
    });

    return {
      summary: {
        totalUnits: totalCount,
        totalValuation,
        states: statsMap,
      },
      propertiesBreakdown: Object.values(propertyMap),
    };
  }
}
