import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Advertisement } from './advertisement.entity';

@Entity('rems_advertisement_performance')
@Index('idx_advertisement_performance_date', ['performanceDate'])
export class AdvertisementPerformance {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'performance_id' })
  id: number;

  @ManyToOne(() => Advertisement, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement: Advertisement;

  @Column({ name: 'performance_date', type: 'date', nullable: true })
  performanceDate: Date;

  @Column({ type: 'bigint', default: 0 })
  impressions: number;

  @Column({ type: 'bigint', default: 0 })
  clicks: number;

  @Column({ type: 'bigint', default: 0 })
  inquiries: number;

  @Column({ name: 'leads_generated', type: 'bigint', default: 0 })
  leadsGenerated: number;

  @Column({ type: 'bigint', default: 0 })
  conversions: number;

  @Column({ name: 'revenue_generated', type: 'numeric', precision: 18, scale: 2, nullable: true })
  revenueGenerated: number;

  @Column({ name: 'cost_per_click', type: 'numeric', precision: 18, scale: 2, nullable: true })
  costPerClick: number;

  @Column({ name: 'cost_per_lead', type: 'numeric', precision: 18, scale: 2, nullable: true })
  costPerLead: number;

  @Column({ name: 'roi_percentage', type: 'numeric', precision: 10, scale: 2, nullable: true })
  roiPercentage: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
