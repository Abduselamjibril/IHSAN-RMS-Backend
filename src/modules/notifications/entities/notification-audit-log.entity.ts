import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Notification as NotificationEntity } from './notification.entity';

@Entity('rems_notification_audit_log')
export class NotificationAuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_audit_log_id' })
  id: number;

  @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @Column({ name: 'action_type_id', type: 'varchar', length: 50 })
  actionType: string; // 'CREATED', 'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRIED', 'CANCELLED'

  @Column({ name: 'action_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  actionDate: Date;

  @Column({ name: 'action_by', type: 'varchar', length: 100, nullable: true })
  actionBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
