import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './lead.entity';

@Entity('crm_lead_activity')
export class LeadActivity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Lead, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'activity_type', type: 'varchar', length: 50 })
  activityType: string;

  @Column({ name: 'activity_date', type: 'timestamp' })
  activityDate: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'performed_by', type: 'bigint', nullable: true })
  performedBy: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outcome: string;

  @Column({ name: 'next_action_date', type: 'timestamp', nullable: true })
  nextActionDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
