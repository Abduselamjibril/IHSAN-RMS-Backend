import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Lead } from '../../crm/entities/lead.entity';
import { MarketingCampaign } from './marketing-campaign.entity';
import { LeadSource } from '../../crm/entities/lead-source.entity';
import { Advertisement } from './advertisement.entity';

@Entity('rems_marketing_lead')
@Index('idx_marketing_lead_campaign', ['campaign'])
@Index('idx_marketing_lead_source', ['leadSource'])
export class MarketingLead {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'marketing_lead_id' })
  id: number;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @ManyToOne(() => MarketingCampaign, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign | null;

  @ManyToOne(() => LeadSource, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'lead_source_id' })
  leadSource: LeadSource | null;

  @ManyToOne(() => Advertisement, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement: Advertisement | null;

  @Column({ name: 'lead_score', type: 'numeric', precision: 10, scale: 2, nullable: true })
  leadScore: number;

  @Column({ name: 'conversion_probability', type: 'numeric', precision: 10, scale: 2, nullable: true })
  conversionProbability: number;

  @Column({ name: 'acquisition_cost', type: 'numeric', precision: 18, scale: 2, nullable: true })
  acquisitionCost: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
