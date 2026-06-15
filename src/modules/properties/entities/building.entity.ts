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

@Entity('rems_building')
@Index('idx_rems_building_code', ['buildingCode'], { unique: true })
@Index('idx_rems_building_property_id', ['property'])
@Index('idx_rems_building_site_id', ['site'])
@Index('idx_rems_building_is_deleted', ['isDeleted'])
export class Building {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Site, (site) => site.buildings, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site: Site | null;

  @Column({ name: 'building_code', type: 'varchar', length: 30, unique: true })
  buildingCode: string;

  @Column({ name: 'building_name', type: 'varchar', length: 150 })
  buildingName: string;

  @Column({ name: 'building_type', type: 'varchar', length: 50, nullable: true })
  buildingType: string;

  @Column({ name: 'total_floors', type: 'integer', default: 0 })
  totalFloors: number;

  @Column({ name: 'basement_floors', type: 'integer', default: 0 })
  basementFloors: number;

  @Column({ name: 'elevator_count', type: 'integer', default: 0 })
  elevatorCount: number;

  @Column({ name: 'total_units', type: 'integer', default: 0 })
  totalUnits: number;

  @Column({ name: 'construction_status', type: 'varchar', length: 50, nullable: true })
  constructionStatus: string;

  @Column({ name: 'completion_percentage', type: 'numeric', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  @Column({ name: 'handover_date', type: 'date', nullable: true })
  handoverDate: Date;

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
