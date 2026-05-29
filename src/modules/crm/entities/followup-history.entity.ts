import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FollowupReminder } from './followup-reminder.entity';

@Entity('crm_followup_history')
export class FollowupHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => FollowupReminder, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reminder_id' })
  reminder: FollowupReminder;

  @Column({ name: 'action_taken', type: 'varchar', length: 100, nullable: true })
  actionTaken: string;

  @Column({ name: 'old_status', type: 'varchar', length: 30, nullable: true })
  oldStatus: string;

  @Column({ name: 'new_status', type: 'varchar', length: 30, nullable: true })
  newStatus: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'action_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  actionDate: Date;

  @Column({ name: 'action_by', type: 'bigint', nullable: true })
  actionBy: number;
}
