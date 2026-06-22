import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('rems_marketing_notification_config')
export class MarketingNotificationConfig {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_config_id' })
  id: number;

  @Column({ name: 'notification_type', type: 'varchar', length: 100, nullable: true })
  notificationType: string;

  @Column({ name: 'trigger_event', type: 'varchar', length: 100, nullable: true })
  triggerEvent: string;

  @Column({ name: 'email_enabled', type: 'boolean', default: false })
  emailEnabled: boolean;

  @Column({ name: 'sms_enabled', type: 'boolean', default: false })
  smsEnabled: boolean;

  @Column({ name: 'telegram_enabled', type: 'boolean', default: false })
  telegramEnabled: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
