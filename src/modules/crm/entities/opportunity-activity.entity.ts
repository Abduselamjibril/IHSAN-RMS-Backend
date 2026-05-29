import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

@Entity('crm_opportunity_activity')
export class OpportunityActivity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Opportunity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column({ name: 'activity_type', type: 'varchar', length: 50, nullable: true })
  activityType: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'activity_date', type: 'timestamp', nullable: true })
  activityDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  outcome: string;

  @Column({ name: 'performed_by', type: 'bigint', nullable: true })
  performedBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
