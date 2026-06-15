import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { Building } from './building.entity';
import { Floor } from './floor.entity';
import { Unit } from './unit.entity';

@Entity('rems_floor_plan')
@Index('idx_rems_floor_plan_property', ['property'])
@Index('idx_rems_floor_plan_building', ['building'])
@Index('idx_rems_floor_plan_floor', ['floor'])
@Index('idx_rems_floor_plan_unit', ['unit'])
export class FloorPlan {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Building, { nullable: true })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @ManyToOne(() => Floor, { nullable: true })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'plan_name', type: 'varchar', length: 200, nullable: true })
  planName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  fileType: string;

  @Column({ name: 'version_number', type: 'integer', default: 1 })
  versionNumber: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, default: 1 })
  uploadedBy: number;
}
