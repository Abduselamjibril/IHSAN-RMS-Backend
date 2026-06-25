import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('rems_broker_performance_snapshot')
@Index('IX_BrokerPerformanceSnapshot_BrokerId', ['broker', 'snapshotDate'])
export class BrokerPerformanceSnapshot {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_performance_snapshot_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({ name: 'leads_assigned', type: 'integer', default: 0 })
  leadsAssigned: number;

  @Column({ name: 'reservations_created', type: 'integer', default: 0 })
  reservationsCreated: number;

  @Column({ name: 'sales_count', type: 'integer', default: 0 })
  salesCount: number;

  @Column({ name: 'sales_value', type: 'numeric', precision: 18, scale: 2, default: 0 })
  salesValue: number;

  @Column({ name: 'commission_earned', type: 'numeric', precision: 18, scale: 2, default: 0 })
  commissionEarned: number;

  @Column({ name: 'commission_paid', type: 'numeric', precision: 18, scale: 2, default: 0 })
  commissionPaid: number;

  @Column({ name: 'conversion_rate', type: 'numeric', precision: 18, scale: 4, nullable: true })
  conversionRate: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
