import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BrokerSale } from './broker-sale.entity';
import { Broker } from './broker.entity';
import { CommissionPlan } from './commission-plan.entity';
import { BrokerCommissionAdjustment } from './broker-commission-adjustment.entity';

@Entity('rems_broker_commission')
@Index('IX_BrokerCommission_BrokerId', ['broker', 'statusId'])
@Index('IX_BrokerCommission_Status', ['statusId'])
export class BrokerCommission {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_commission_id' })
  id: number;

  @ManyToOne(() => BrokerSale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_sale_id' })
  brokerSale: BrokerSale;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @ManyToOne(() => CommissionPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_plan_id' })
  commissionPlan: CommissionPlan;

  @Column({ name: 'sale_amount', type: 'numeric', precision: 18, scale: 2 })
  saleAmount: number;

  @Column({ name: 'commission_rate', type: 'numeric', precision: 18, scale: 4, nullable: true })
  commissionRate?: number | null;

  @Column({ name: 'commission_amount', type: 'numeric', precision: 18, scale: 2 })
  commissionAmount: number;

  @Column({ name: 'status_id', type: 'varchar', length: 50, default: 'PENDING' })
  statusId: string; // PENDING, APPROVED, PAYABLE, PAID, CANCELLED

  @Column({ name: 'calculated_date', type: 'timestamptz' })
  calculatedDate: Date;

  @Column({ name: 'approved_by', type: 'varchar', length: 50, nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_date', type: 'timestamptz', nullable: true })
  approvedDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => BrokerCommissionAdjustment, (adj) => adj.brokerCommission, { cascade: true })
  adjustments: BrokerCommissionAdjustment[];
}
