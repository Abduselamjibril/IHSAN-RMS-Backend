import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { Site } from './site.entity';
import { Building } from './building.entity';
import { Floor } from './floor.entity';
import { UnitType } from './unit-type.entity';
import { UnitStatus } from './unit-status.entity';

@Entity('rems_unit')
@Index('idx_rems_unit_code', ['unitCode'], { unique: true })
@Index('idx_rems_unit_property', ['property'])
@Index('idx_rems_unit_site', ['site'])
@Index('idx_rems_unit_building', ['building'])
@Index('idx_rems_unit_floor', ['floor'])
@Index('idx_rems_unit_type', ['unitType'])
@Index('idx_rems_unit_status', ['unitStatus'])
@Index('idx_rems_unit_price', ['currentPrice'])
@Index('idx_rems_unit_available', ['unitStatus'], { where: 'is_deleted = false' })
export class Unit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Site, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site: Site | null;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @ManyToOne(() => Floor, { eager: true })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @ManyToOne(() => UnitType, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'unit_type_id' })
  unitType: UnitType | null;

  @ManyToOne(() => UnitStatus, { eager: true })
  @JoinColumn({ name: 'unit_status_id' })
  unitStatus: UnitStatus;

  @Column({ name: 'unit_code', type: 'varchar', length: 50, unique: true })
  unitCode: string;

  @Column({ name: 'unit_number', type: 'varchar', length: 50 })
  unitNumber: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string;

  @Column({ name: 'bedroom_count', type: 'integer', default: 0 })
  bedroomCount: number;

  @Column({ name: 'bathroom_count', type: 'integer', default: 0 })
  bathroomCount: number;

  @Column({ name: 'parking_slot_count', type: 'integer', default: 0 })
  parkingSlotCount: number;

  @Column({ name: 'gross_area', type: 'numeric', precision: 18, scale: 2, nullable: true })
  grossArea: number;

  @Column({ name: 'net_area', type: 'numeric', precision: 18, scale: 2, nullable: true })
  netArea: number;

  @Column({ name: 'balcony_area', type: 'numeric', precision: 18, scale: 2, nullable: true })
  balconyArea: number;

  @Column({ name: 'facing_direction', type: 'varchar', length: 50, nullable: true })
  facingDirection: string;

  @Column({ name: 'view_type', type: 'varchar', length: 100, nullable: true })
  viewType: string;

  @Column({ name: 'floor_level', type: 'integer', nullable: true })
  floorLevel: number;

  @Column({ name: 'is_furnished', type: 'boolean', default: false })
  isFurnished: boolean;

  @Column({ name: 'is_corner_unit', type: 'boolean', default: false })
  isCornerUnit: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'inventory_tags', type: 'text', array: true, nullable: true })
  inventoryTags: string[];

  @Column({ name: 'current_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  currentPrice: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'ETB' })
  currencyCode: string;

  @Column({ name: 'reservation_expiry', type: 'timestamp', nullable: true })
  reservationExpiry: Date | null;

  @Column({ name: 'sold_date', type: 'date', nullable: true })
  soldDate: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
