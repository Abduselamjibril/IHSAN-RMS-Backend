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
import { CommunicationChannel } from './communication-channel.entity';

@Entity('crm_communication')
export class Communication {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Lead, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @ManyToOne(() => Opportunity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @ManyToOne(() => CommunicationChannel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'communication_channel_id' })
  communicationChannel: CommunicationChannel;

  @Column({ name: 'communication_direction', type: 'varchar', length: 20, nullable: true })
  communicationDirection: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  subject: string;

  @Column({ name: 'message_body', type: 'text', nullable: true })
  messageBody: string;

  @Column({ name: 'communication_datetime', type: 'timestamp', nullable: true })
  communicationDatetime: Date;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds: number;

  @Column({ name: 'external_reference', type: 'varchar', length: 200, nullable: true })
  externalReference: string;

  @Column({ name: 'communication_status', type: 'varchar', length: 50, nullable: true })
  communicationStatus: string;

  @Column({ name: 'communicated_by', type: 'bigint', nullable: true })
  communicatedBy: number;

  @Column({ name: 'customer_response', type: 'text', nullable: true })
  customerResponse: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
