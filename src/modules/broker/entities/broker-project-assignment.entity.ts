import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Broker } from './broker.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity('rems_broker_project_assignment')
export class BrokerProjectAssignment {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_project_assignment_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ name: 'status_id', type: 'varchar', length: 50, default: 'ACTIVE' })
  statusId: string; // ACTIVE, INACTIVE

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
