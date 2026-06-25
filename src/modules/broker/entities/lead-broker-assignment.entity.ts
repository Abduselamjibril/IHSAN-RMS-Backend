import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Broker } from './broker.entity';
import { Lead } from '../../crm/entities/lead.entity';

@Entity('rems_lead_broker_assignment')
export class LeadBrokerAssignment {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'lead_broker_assignment_id' })
  id: number;

  @ManyToOne(() => Lead, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'assigned_date', type: 'timestamptz' })
  assignedDate: Date;

  @Column({ name: 'assigned_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  assignedBy: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'remarks', type: 'varchar', length: 500, nullable: true })
  remarks?: string | null;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
