import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { Opportunity } from './opportunity.entity';
import { SalesAgent } from './sales-agent.entity';

@Entity('crm_followup_reminder')
export class FollowupReminder {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @ManyToOne(() => Opportunity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @ManyToOne(() => SalesAgent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: SalesAgent;

  @Column({ name: 'reminder_type', type: 'varchar', length: 50, nullable: true })
  reminderType: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ name: 'reminder_datetime', type: 'timestamp' })
  reminderDatetime: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  priority: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string;

  @Column({ name: 'reminder_message', type: 'text', nullable: true })
  reminderMessage: string;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
