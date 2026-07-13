import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NotificationQueue } from './notification-queue.entity';

@Entity('rems_notification_retry_log')
export class NotificationRetryLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_retry_log_id' })
  id: number;

  @ManyToOne(() => NotificationQueue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_queue_id' })
  queueItem: NotificationQueue;

  @Column({ name: 'retry_number', type: 'integer' })
  retryNumber: number;

  @Column({ name: 'retry_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  retryDate: Date;

  @Column({ name: 'retry_result_id', type: 'varchar', length: 50 })
  retryResult: string; // 'SUCCESS', 'FAILED'

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;
}
