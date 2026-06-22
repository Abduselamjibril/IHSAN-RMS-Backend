import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';

@Entity('rems_campaign_summary')
export class CampaignSummary {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'campaign_summary_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ name: 'total_leads', type: 'integer', nullable: true })
  totalLeads: number;

  @Column({ name: 'qualified_leads', type: 'integer', nullable: true })
  qualifiedLeads: number;

  @Column({ name: 'converted_leads', type: 'integer', nullable: true })
  convertedLeads: number;

  @Column({ name: 'total_sales', type: 'integer', nullable: true })
  totalSales: number;

  @Column({ name: 'total_revenue', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalRevenue: number;

  @Column({ name: 'total_expense', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalExpense: number;

  @Column({ name: 'roi_percentage', type: 'numeric', precision: 10, scale: 2, nullable: true })
  roiPercentage: number;

  @UpdateDateColumn({ name: 'last_updated', type: 'timestamptz', nullable: true })
  lastUpdated: Date;
}
