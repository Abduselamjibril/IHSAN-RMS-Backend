import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Communication } from './communication.entity';

@Entity('crm_communication_audit')
export class CommunicationAudit {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Communication, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'communication_id' })
  communication: Communication;

  @Column({ name: 'audit_action', type: 'varchar', length: 50, nullable: true })
  auditAction: string;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: any;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: any;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true })
  changedBy: number;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
