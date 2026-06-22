import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';
import { Advertisement } from './advertisement.entity';

@Entity('rems_marketing_notification_log')
export class MarketingNotificationLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_log_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign | null;

  @ManyToOne(() => Advertisement, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement: Advertisement | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  recipient: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 50, nullable: true })
  notificationType: string;

  @Column({ name: 'message_content', type: 'text', nullable: true })
  messageContent: string;

  @Column({ name: 'delivery_status', type: 'varchar', length: 50, nullable: true })
  deliveryStatus: string;

  @Column({ name: 'sent_date', type: 'timestamptz', nullable: true })
  sentDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
