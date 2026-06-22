import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';

@Entity('rems_campaign_budget')
export class CampaignBudget {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'campaign_budget_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ name: 'allocated_budget', type: 'numeric', precision: 18, scale: 2 })
  allocatedBudget: number;

  @Column({ name: 'utilized_budget', type: 'numeric', precision: 18, scale: 2, default: 0 })
  utilizedBudget: number;

  @Column({ name: 'remaining_budget', type: 'numeric', precision: 18, scale: 2, nullable: true })
  remainingBudget: number;

  @UpdateDateColumn({ name: 'last_updated', type: 'timestamptz', nullable: true })
  lastUpdated: Date;
}
