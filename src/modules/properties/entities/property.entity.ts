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
import { PropertyType } from './property-type.entity';

@Entity('rems_property')
@Index('idx_rems_property_code', ['propertyCode'], { unique: true })
@Index('idx_rems_property_name', ['propertyName'])
@Index('idx_rems_property_type', ['propertyType'])
@Index('idx_rems_property_status', ['propertyStatus'])
@Index('idx_rems_property_is_deleted', ['isDeleted'])
export class Property {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'property_code', type: 'varchar', length: 30, unique: true })
  propertyCode: string;

  @Column({ name: 'property_name', type: 'varchar', length: 200 })
  propertyName: string;

  @ManyToOne(() => PropertyType, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'property_type_id' })
  propertyType: PropertyType | null;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ name: 'sub_city', type: 'varchar', length: 100, nullable: true })
  subCity: string;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'numeric', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'total_land_area', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalLandArea: number;

  @Column({ name: 'total_builtup_area', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalBuiltupArea: number;

  @Column({ name: 'total_buildings', type: 'integer', default: 0 })
  totalBuildings: number;

  @Column({ name: 'total_units', type: 'integer', default: 0 })
  totalUnits: number;

  @Column({ name: 'launch_date', type: 'date', nullable: true })
  launchDate: Date;

  @Column({ name: 'completion_date', type: 'date', nullable: true })
  completionDate: Date;

  @Column({ name: 'property_status', type: 'varchar', length: 50, nullable: true })
  propertyStatus: string;

  @Column({ name: 'developer_name', type: 'varchar', length: 200, nullable: true })
  developerName: string;

  @Column({ name: 'contact_phone', type: 'varchar', length: 30, nullable: true })
  contactPhone: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 150, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

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
