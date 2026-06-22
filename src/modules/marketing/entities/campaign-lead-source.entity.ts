import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';
import { LeadSource } from '../../crm/entities/lead-source.entity';

@Entity('rems_campaign_lead_source')
export class CampaignLeadSource {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'campaign_lead_source_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @ManyToOne(() => LeadSource, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'lead_source_id' })
  leadSource: LeadSource;

  @Column({ name: 'expected_leads', type: 'integer', default: 0 })
  expectedLeads: number;

  @Column({ name: 'expected_conversions', type: 'integer', default: 0 })
  expectedConversions: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
