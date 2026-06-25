import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CommissionPayment } from './commission-payment.entity';
import { BrokerCommission } from './broker-commission.entity';

@Entity('rems_commission_payment_detail')
export class CommissionPaymentDetail {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'commission_payment_detail_id' })
  id: number;

  @ManyToOne(() => CommissionPayment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_payment_id' })
  commissionPayment: CommissionPayment;

  @ManyToOne(() => BrokerCommission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_commission_id' })
  brokerCommission: BrokerCommission;

  @Column({ name: 'amount_paid', type: 'numeric', precision: 18, scale: 2 })
  amountPaid: number;
}
