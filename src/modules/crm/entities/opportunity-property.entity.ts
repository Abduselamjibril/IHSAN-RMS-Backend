import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

@Entity('crm_opportunity_property')
export class OpportunityProperty {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Opportunity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column({ name: 'property_id', type: 'bigint' })
  propertyId: number;

  @Column({ name: 'unit_id', type: 'bigint', nullable: true })
  unitId: number;

  @Column({ name: 'interested_level', type: 'varchar', length: 50, nullable: true })
  interestedLevel: string;

  @Column({ name: 'estimated_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  estimatedPrice: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
