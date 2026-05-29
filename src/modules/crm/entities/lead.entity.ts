import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LeadSource } from './lead-source.entity';
import { LeadStatus } from './lead-status.entity';
import { SalesAgent } from './sales-agent.entity';

@Entity('crm_lead')
@Index('idx_crm_lead_phone', ['primaryPhone'])
@Index('idx_crm_lead_email', ['primaryEmail'])
@Index('idx_crm_lead_status', ['leadStatus'])
@Index('idx_crm_lead_source', ['leadSource'])
@Index('idx_crm_lead_agent', ['assignedSalesAgent'])
@Index('idx_crm_lead_created', ['createdAt'])
export class Lead {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'lead_code', type: 'varchar', length: 30, unique: true })
  leadCode: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string;

  @Column({ name: 'primary_phone', type: 'varchar', length: 30 })
  primaryPhone: string;

  @Column({ name: 'secondary_phone', type: 'varchar', length: 30, nullable: true })
  secondaryPhone: string;

  @Column({ name: 'primary_email', type: 'varchar', length: 150, nullable: true })
  primaryEmail: string;

  @Column({ name: 'secondary_email', type: 'varchar', length: 150, nullable: true })
  secondaryEmail: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ name: 'preferred_contact_method', type: 'varchar', length: 30, nullable: true })
  preferredContactMethod: string;

  @Column({ name: 'budget_min', type: 'numeric', precision: 18, scale: 2, nullable: true })
  budgetMin: number;

  @Column({ name: 'budget_max', type: 'numeric', precision: 18, scale: 2, nullable: true })
  budgetMax: number;

  @Column({ name: 'interested_property_type', type: 'varchar', length: 50, nullable: true })
  interestedPropertyType: string;

  @ManyToOne(() => LeadSource, { nullable: true })
  @JoinColumn({ name: 'lead_source_id' })
  leadSource: LeadSource;

  @ManyToOne(() => LeadStatus, { nullable: true })
  @JoinColumn({ name: 'lead_status_id' })
  leadStatus: LeadStatus;

  @ManyToOne(() => SalesAgent, { nullable: true })
  @JoinColumn({ name: 'assigned_sales_agent_id' })
  assignedSalesAgent: SalesAgent;

  @Column({ name: 'is_duplicate', type: 'boolean', default: false })
  isDuplicate: boolean;

  @ManyToOne(() => Lead, { nullable: true })
  @JoinColumn({ name: 'duplicate_of_lead_id' })
  duplicateOfLead: Lead;

  @Column({ name: 'last_contacted_at', type: 'timestamp', nullable: true })
  lastContactedAt: Date;

  @Column({ name: 'next_followup_at', type: 'timestamp', nullable: true })
  nextFollowupAt: Date;

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
