import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification as NotificationEntity } from './notification.entity';
import { NotificationRecipient } from './notification-recipient.entity';
import { NotificationChannel } from './notification-channel.entity';

@Entity('rems_notification_delivery_log')
export class NotificationDeliveryLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_delivery_log_id' })
  id: number;

  @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @ManyToOne(() => NotificationRecipient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_recipient_id' })
  recipient: NotificationRecipient;

  @ManyToOne(() => NotificationChannel, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'notification_channel_id' })
  channel: NotificationChannel;

  @Column({ name: 'delivery_status_id', type: 'varchar', length: 50 })
  deliveryStatus: string; // 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'

  @Column({ name: 'provider_response', type: 'text', nullable: true })
  providerResponse: string | null;

  @Column({ name: 'delivery_date', type: 'timestamptz', nullable: true })
  deliveryDate: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
