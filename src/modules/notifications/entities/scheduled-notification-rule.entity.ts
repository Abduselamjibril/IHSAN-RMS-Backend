import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NotificationCategory } from './notification-category.entity';

@Entity('rems_scheduled_notification_rule')
export class ScheduledNotificationRule {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'scheduled_notification_rule_id' })
  id: number;

  @Column({ name: 'rule_code', type: 'varchar', length: 100, unique: true })
  ruleCode: string;

  @Column({ name: 'rule_name', type: 'varchar', length: 250 })
  ruleName: string;

  @ManyToOne(() => NotificationCategory, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_category_id' })
  category: NotificationCategory;

  @Column({ name: 'trigger_event_id', type: 'varchar', length: 100 })
  triggerEventId: string;

  @Column({ name: 'days_before_event', type: 'integer', nullable: true })
  daysBeforeEvent: number;

  @Column({ name: 'days_after_event', type: 'integer', nullable: true })
  daysAfterEvent: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
