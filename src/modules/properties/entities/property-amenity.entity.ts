import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Property } from './property.entity';
import { AmenityMaster } from './amenity-master.entity';

@Entity('rems_property_amenity')
@Unique('uq_property_amenity', ['property', 'amenity'])
export class PropertyAmenity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => AmenityMaster, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: AmenityMaster;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
