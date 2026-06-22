import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';

@Entity('rems_marketing_kpi')
@Index('idx_marketing_kpi_date', ['reportingDate'])
export class MarketingKpi {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'marketing_kpi_id' })
  id: number;

  @Column({ name: 'reporting_date', type: 'date', nullable: true })
  reportingDate: Date;

  @ManyToOne(() => MarketingCampaign, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign | null;

  @Column({ name: 'total_leads', type: 'integer', nullable: true })
  totalLeads: number;

  @Column({ name: 'qualified_leads', type: 'integer', nullable: true })
  qualifiedLeads: number;

  @Column({ name: 'converted_leads', type: 'integer', nullable: true })
  convertedLeads: number;

  @Column({ name: 'conversion_rate', type: 'numeric', precision: 10, scale: 2, nullable: true })
  conversionRate: number;

  @Column({ name: 'total_cost', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalCost: number;

  @Column({ name: 'total_revenue', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalRevenue: number;

  @Column({ name: 'roi_percentage', type: 'numeric', precision: 10, scale: 2, nullable: true })
  roiPercentage: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
