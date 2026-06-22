import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rems_reminder_configuration')
export class ReminderConfiguration {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'reminder_configuration_id' })
  id: number;

  @Column({ name: 'reminder_days_before_due', type: 'integer', nullable: true })
  reminderDaysBeforeDue: number;

  @Column({ name: 'reminder_days_after_due', type: 'integer', nullable: true })
  reminderDaysAfterDue: number;

  @Column({ name: 'sms_enabled', type: 'boolean', default: false })
  smsEnabled: boolean;

  @Column({ name: 'email_enabled', type: 'boolean', default: false })
  emailEnabled: boolean;

  @Column({ name: 'telegram_enabled', type: 'boolean', default: false })
  telegramEnabled: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
