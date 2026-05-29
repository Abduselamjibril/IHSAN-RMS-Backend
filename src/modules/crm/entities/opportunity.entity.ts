import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from './lead.entity';
import { OpportunityStage } from './opportunity-stage.entity';
import { SalesAgent } from './sales-agent.entity';
import { OpportunityLossReason } from './opportunity-loss-reason.entity';

@Entity('crm_opportunity')
export class Opportunity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'opportunity_code', type: 'varchar', length: 30, unique: true })
  opportunityCode: string;

  @ManyToOne(() => Lead, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ManyToOne(() => OpportunityStage, { nullable: true })
  @JoinColumn({ name: 'opportunity_stage_id' })
  opportunityStage: OpportunityStage;

  @ManyToOne(() => SalesAgent, { nullable: true })
  @JoinColumn({ name: 'assigned_sales_agent_id' })
  assignedSalesAgent: SalesAgent;

  @Column({ name: 'estimated_value', type: 'numeric', precision: 18, scale: 2, nullable: true })
  estimatedValue: number;

  @Column({ name: 'probability_percent', type: 'numeric', precision: 5, scale: 2, nullable: true })
  probabilityPercent: number;

  @Column({ name: 'expected_close_date', type: 'date', nullable: true })
  expectedCloseDate: Date;

  @Column({ name: 'actual_close_date', type: 'date', nullable: true })
  actualCloseDate: Date;

  @Column({ name: 'is_won', type: 'boolean', nullable: true })
  isWon: boolean;

  @Column({ name: 'is_lost', type: 'boolean', nullable: true })
  isLost: boolean;

  @ManyToOne(() => OpportunityLossReason, { nullable: true })
  @JoinColumn({ name: 'loss_reason_id' })
  lossReason: OpportunityLossReason;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}
