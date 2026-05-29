import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FollowupReminder } from './followup-reminder.entity';

@Entity('crm_followup_notification')
export class FollowupNotification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => FollowupReminder, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reminder_id' })
  reminder: FollowupReminder;

  @Column({ name: 'notification_type', type: 'varchar', length: 30, nullable: true })
  notificationType: string;

  @Column({ type: 'bigint', nullable: true })
  recipient: number;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'delivery_status', type: 'varchar', length: 30, nullable: true })
  deliveryStatus: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;
}
