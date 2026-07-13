import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Notification as NotificationEntity } from './notification.entity';

@Entity('rems_notification_read_history')
export class NotificationReadHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_read_history_id' })
  id: number;

  @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'read_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  readDate: Date;
}
