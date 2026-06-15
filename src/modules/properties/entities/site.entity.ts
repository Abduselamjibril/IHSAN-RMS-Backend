import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { Building } from './building.entity';

@Entity('rems_site')
@Index('idx_rems_site_name', ['siteName'])
@Index('idx_rems_site_property_id', ['property'])
@Index('idx_rems_site_is_deleted', ['isDeleted'])
export class Site {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'site_name', type: 'varchar', length: 200 })
  siteName: string;

  @Column({ name: 'site_location', type: 'text', nullable: true })
  siteLocation: string;

  @ManyToOne(() => Property, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @OneToMany(() => Building, (building) => building.site)
  buildings: Building[];

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
