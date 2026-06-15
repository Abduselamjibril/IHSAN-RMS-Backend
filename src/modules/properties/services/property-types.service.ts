import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyType } from '../entities/property-type.entity';
import { CreatePropertyTypeDto, UpdatePropertyTypeDto } from '../dto/master-crud.dto';

@Injectable()
export class PropertyTypesService {
  constructor(
    @InjectRepository(PropertyType)
    private readonly propertyTypeRepo: Repository<PropertyType>,
  ) {}

  async create(dto: CreatePropertyTypeDto): Promise<PropertyType> {
    const propertyType = this.propertyTypeRepo.create(dto);
    return this.propertyTypeRepo.save(propertyType);
  }

  async findAll(): Promise<PropertyType[]> {
    return this.propertyTypeRepo.find({ order: { typeName: 'ASC' } });
  }

  async findOne(id: number): Promise<PropertyType> {
    const type = await this.propertyTypeRepo.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundException(`Property Type with ID ${id} not found`);
    }
    return type;
  }

  async update(id: number, dto: UpdatePropertyTypeDto): Promise<PropertyType> {
    const type = await this.findOne(id);
    Object.assign(type, dto);
    return this.propertyTypeRepo.save(type);
  }

  async remove(id: number): Promise<void> {
    const type = await this.findOne(id);
    await this.propertyTypeRepo.remove(type);
  }

  async findOrCreateByName(name: string): Promise<PropertyType> {
    const trimmedName = name.trim();
    let type = await this.propertyTypeRepo.findOne({
      where: { typeName: trimmedName },
    });
    if (!type) {
      type = this.propertyTypeRepo.create({
        typeName: trimmedName,
        description: 'Dynamically added via "Other" option',
      });
      type = await this.propertyTypeRepo.save(type);
    }
    return type;
  }
}
