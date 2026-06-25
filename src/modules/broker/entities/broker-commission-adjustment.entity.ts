import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BrokerCommission } from './broker-commission.entity';

@Entity('rems_broker_commission_adjustment')
export class BrokerCommissionAdjustment {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_commission_adjustment_id' })
  id: number;

  @ManyToOne(() => BrokerCommission, (comm) => comm.adjustments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_commission_id' })
  brokerCommission: BrokerCommission;

  @Column({ name: 'adjustment_type_id', type: 'varchar', length: 50 })
  adjustmentTypeId: string; // INCREASE, DECREASE

  @Column({ name: 'adjustment_amount', type: 'numeric', precision: 18, scale: 2 })
  adjustmentAmount: number;

  @Column({ name: 'reason', type: 'varchar', length: 1000 })
  reason: string;

  @Column({ name: 'approved_by', type: 'varchar', length: 50, nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_date', type: 'timestamptz', nullable: true })
  approvedDate: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
