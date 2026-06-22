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

@Entity('rems_advertisement')
@Index('idx_advertisement_campaign', ['campaign'])
export class Advertisement {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'advertisement_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ name: 'advertisement_code', type: 'varchar', length: 50, unique: true, nullable: true })
  advertisementCode: string;

  @Column({ name: 'advertisement_title', type: 'varchar', length: 200, nullable: true })
  advertisementTitle: string;

  @Column({ name: 'advertisement_channel', type: 'varchar', length: 100, nullable: true })
  advertisementChannel: string; // FACEBOOK, INSTAGRAM, TELEGRAM, TIKTOK, YOUTUBE, TV, RADIO, NEWSPAPER, BILLBOARD, WEBSITE, EMAIL

  @Column({ name: 'advertisement_content', type: 'text', nullable: true })
  advertisementContent: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'planned_budget', type: 'numeric', precision: 18, scale: 2, nullable: true })
  plannedBudget: number;

  @Column({ name: 'advertisement_status', type: 'varchar', length: 50, nullable: true })
  advertisementStatus: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
