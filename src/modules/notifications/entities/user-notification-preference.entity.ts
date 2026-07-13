import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { NotificationCategory } from './notification-category.entity';

@Entity('rems_user_notification_preference')
export class UserNotificationPreference {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'user_notification_preference_id' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @ManyToOne(() => NotificationCategory, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_category_id' })
  category: NotificationCategory;

  @Column({ name: 'enable_email', type: 'boolean', default: true })
  enableEmail: boolean;

  @Column({ name: 'enable_sms', type: 'boolean', default: true })
  enableSMS: boolean;

  @Column({ name: 'enable_push', type: 'boolean', default: true })
  enablePush: boolean;

  @Column({ name: 'enable_in_app', type: 'boolean', default: true })
  enableInApp: boolean;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
