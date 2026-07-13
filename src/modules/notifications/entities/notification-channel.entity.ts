import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rems_notification_channel')
export class NotificationChannel {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_channel_id' })
  id: number;

  @Column({ name: 'channel_code', type: 'varchar', length: 50, unique: true })
  channelCode: string;

  @Column({ name: 'channel_name', type: 'varchar', length: 100 })
  channelName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'telegram_api_id', type: 'integer', nullable: true })
  telegramApiId: number | null;

  @Column({ name: 'telegram_api_hash', type: 'varchar', length: 100, nullable: true })
  telegramApiHash: string | null;

  @Column({ name: 'telegram_session_string', type: 'text', nullable: true })
  telegramSessionString: string | null;
}
