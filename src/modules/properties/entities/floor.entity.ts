import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Building } from './building.entity';

@Entity('rems_floor')
@Unique('uq_building_floor', ['building', 'floorNumber'])
@Index('idx_rems_floor_building_id', ['building'])
@Index('idx_rems_floor_is_deleted', ['isDeleted'])
export class Floor {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Building, { eager: true })
  @JoinColumn({ name: 'building_id' })
  building: Building;

  @Column({ name: 'floor_number', type: 'integer' })
  floorNumber: number;

  @Column({ name: 'floor_name', type: 'varchar', length: 100, nullable: true })
  floorName: string;

  @Column({ name: 'floor_type', type: 'varchar', length: 50, nullable: true })
  floorType: string;

  @Column({ name: 'total_units', type: 'integer', default: 0 })
  totalUnits: number;

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
