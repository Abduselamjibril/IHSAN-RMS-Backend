import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Notification as NotificationEntity } from './notification.entity';
import { NotificationChannel } from './notification-channel.entity';

@Entity('rems_notification_queue')
export class NotificationQueue {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_queue_id' })
  id: number;

  @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @ManyToOne(() => NotificationChannel, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'notification_channel_id' })
  channel: NotificationChannel;

  @Column({ name: 'queue_status_id', type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // 'PENDING', 'PROCESSING', 'SENT', 'FAILED'

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount: number;

  @Column({ name: 'next_retry_date', type: 'timestamptz', nullable: true })
  nextRetryDate: Date | null;

  @Column({ name: 'last_attempt_date', type: 'timestamptz', nullable: true })
  lastAttemptDate: Date | null;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
