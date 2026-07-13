import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { NotificationCategory } from './notification-category.entity';
import { NotificationTemplate } from './notification-template.entity';
import { NotificationRecipient } from './notification-recipient.entity';

@Entity('rems_notification')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_id' })
  id: number;

  @ManyToOne(() => NotificationCategory, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'notification_category_id' })
  category: NotificationCategory;

  @ManyToOne(() => NotificationTemplate, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'notification_template_id' })
  template: NotificationTemplate | null;

  @Column({ name: 'reference_type_id', type: 'varchar', length: 50, nullable: true })
  referenceTypeId: string | null; // e.g., 'CONTRACT', 'RESERVATION', 'LEAD', 'PAYMENT'

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: number | null;

  @Column({ name: 'notification_title', type: 'varchar', length: 500 })
  notificationTitle: string;

  @Column({ name: 'notification_body', type: 'text' })
  notificationBody: string;

  @Column({ name: 'priority_id', type: 'varchar', length: 50, default: 'NORMAL' })
  priority: string; // 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'

  @Column({ name: 'notification_status_id', type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // 'PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED'

  @Column({ name: 'scheduled_date', type: 'timestamptz', nullable: true })
  scheduledDate: Date | null;

  @Column({ name: 'sent_date', type: 'timestamptz', nullable: true })
  sentDate: Date | null;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => NotificationRecipient, (r) => r.notification, { cascade: true })
  recipients: NotificationRecipient[];
}
