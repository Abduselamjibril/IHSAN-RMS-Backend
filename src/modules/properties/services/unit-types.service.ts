import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitType } from '../entities/unit-type.entity';
import { CreateUnitTypeDto, UpdateUnitTypeDto } from '../dto/master-crud.dto';

@Injectable()
export class UnitTypesService {
  constructor(
    @InjectRepository(UnitType)
    private readonly unitTypeRepo: Repository<UnitType>,
  ) {}

  async create(dto: CreateUnitTypeDto): Promise<UnitType> {
    const unitType = this.unitTypeRepo.create(dto);
    return this.unitTypeRepo.save(unitType);
  }

  async findAll(): Promise<UnitType[]> {
    return this.unitTypeRepo.find({ order: { typeName: 'ASC' } });
  }

  async findOne(id: number): Promise<UnitType> {
    const type = await this.unitTypeRepo.findOne({ where: { id } });
    if (!type) {
      throw new NotFoundException(`Unit Type with ID ${id} not found`);
    }
    return type;
  }

  async update(id: number, dto: UpdateUnitTypeDto): Promise<UnitType> {
    const type = await this.findOne(id);
    Object.assign(type, dto);
    return this.unitTypeRepo.save(type);
  }

  async remove(id: number): Promise<void> {
    const type = await this.findOne(id);
    await this.unitTypeRepo.remove(type);
  }

  async findOrCreateByName(name: string): Promise<UnitType> {
    const trimmedName = name.trim();
    let type = await this.unitTypeRepo.findOne({
      where: { typeName: trimmedName },
    });
    if (!type) {
      type = this.unitTypeRepo.create({
        typeName: trimmedName,
        description: 'Dynamically added via "Other" option',
      });
      type = await this.unitTypeRepo.save(type);
    }
    return type;
  }
}
