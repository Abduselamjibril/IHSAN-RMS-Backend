import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from '../entities/site.entity';
import { Property } from '../entities/property.entity';
import { Building } from '../entities/building.entity';
import { CreateSiteDto, UpdateSiteDto } from '../dto/property-crud.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    @InjectRepository(Building)
    private readonly buildingRepo: Repository<Building>,
  ) {}

  async createSite(propertyId: number, dto: CreateSiteDto): Promise<Site> {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId, isDeleted: false } });
    if (!property) {
      throw new NotFoundException(`Property with ID ${propertyId} not found.`);
    }

    const site = this.siteRepo.create({
      siteName: dto.siteName,
      siteLocation: dto.siteLocation,
      property,
    });

    return this.siteRepo.save(site);
  }

  async findAllSites(propertyId: number): Promise<Site[]> {
    return this.siteRepo.find({
      where: { property: { id: propertyId }, isDeleted: false },
      order: { siteName: 'ASC' },
      relations: { buildings: true }
    });
  }

  async findOneSite(id: number): Promise<Site> {
    const site = await this.siteRepo.findOne({
      where: { id, isDeleted: false },
      relations: { property: true, buildings: true }
    });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found.`);
    }
    return site;
  }

  async updateSite(id: number, dto: UpdateSiteDto): Promise<Site> {
    const site = await this.siteRepo.findOne({ where: { id, isDeleted: false } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found.`);
    }

    Object.assign(site, dto);
    return this.siteRepo.save(site);
  }

  async removeSite(id: number): Promise<void> {
    const site = await this.siteRepo.findOne({ where: { id, isDeleted: false } });
    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found.`);
    }

    site.isDeleted = true;
    await this.siteRepo.save(site);

    // Cascading soft-delete associated buildings
    const buildings = await this.buildingRepo.find({ where: { site: { id } } });
    for (const b of buildings) {
      b.isDeleted = true;
      await this.buildingRepo.save(b);
    }
  }
}
