import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('rems_commission_payment')
@Index('IX_CommissionPayment_BrokerId', ['broker'])
export class CommissionPayment {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'commission_payment_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'payment_reference', type: 'varchar', length: 100 })
  paymentReference: string;

  @Column({ name: 'payment_date', type: 'timestamptz' })
  paymentDate: Date;

  @Column({ name: 'total_amount', type: 'numeric', precision: 18, scale: 2 })
  totalAmount: number;

  @Column({ name: 'payment_method_id', type: 'varchar', length: 50 })
  paymentMethodId: string; // BANK_TRANSFER, CHECK, CASH

  @Column({ name: 'status_id', type: 'varchar', length: 50, default: 'PAID' })
  statusId: string; // PAID, VOIDED

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
