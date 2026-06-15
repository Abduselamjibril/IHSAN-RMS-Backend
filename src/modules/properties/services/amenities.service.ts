import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmenityMaster } from '../entities/amenity-master.entity';
import { CreateAmenityDto, UpdateAmenityDto } from '../dto/master-crud.dto';

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectRepository(AmenityMaster)
    private readonly amenityRepo: Repository<AmenityMaster>,
  ) {}

  async create(dto: CreateAmenityDto): Promise<AmenityMaster> {
    const amenity = this.amenityRepo.create(dto);
    return this.amenityRepo.save(amenity);
  }

  async findAll(): Promise<AmenityMaster[]> {
    return this.amenityRepo.find({ order: { amenityName: 'ASC' } });
  }

  async findOne(id: number): Promise<AmenityMaster> {
    const amenity = await this.amenityRepo.findOne({ where: { id } });
    if (!amenity) {
      throw new NotFoundException(`Amenity with ID ${id} not found`);
    }
    return amenity;
  }

  async update(id: number, dto: UpdateAmenityDto): Promise<AmenityMaster> {
    const amenity = await this.findOne(id);
    Object.assign(amenity, dto);
    return this.amenityRepo.save(amenity);
  }

  async remove(id: number): Promise<void> {
    const amenity = await this.findOne(id);
    await this.amenityRepo.remove(amenity);
  }

  async findOrCreateByName(name: string): Promise<AmenityMaster> {
    const trimmedName = name.trim();
    let amenity = await this.amenityRepo.findOne({
      where: { amenityName: trimmedName },
    });
    if (!amenity) {
      amenity = this.amenityRepo.create({
        amenityName: trimmedName,
        icon: 'star',
        description: 'Dynamically added via "Other" option',
      });
      amenity = await this.amenityRepo.save(amenity);
    }
    return amenity;
  }
}
