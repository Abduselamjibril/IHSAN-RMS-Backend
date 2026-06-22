import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SalesContract } from '../../sales/entities/sales-contract.entity';
import { Customer } from '../../crm/entities/customer.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('rems_payment')
@Index('idx_rems_payment_contract', ['contract'])
@Index('idx_rems_payment_customer', ['customer'])
@Index('idx_rems_payment_date', ['paymentDate'])
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payment_id' })
  id: number;

  @Column({ name: 'payment_reference', type: 'varchar', length: 100, unique: true, nullable: true })
  paymentReference: string;

  @ManyToOne(() => SalesContract, { eager: true })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => PaymentMethod, { eager: true })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_date', type: 'timestamptz' })
  paymentDate: Date;

  @Column({ name: 'payment_amount', type: 'numeric', precision: 18, scale: 2 })
  paymentAmount: number;

  @Column({ name: 'bank_name', type: 'varchar', length: 200, nullable: true })
  bankName: string;

  @Column({ name: 'transaction_reference', type: 'varchar', length: 200, nullable: true })
  transactionReference: string;

  @Column({ name: 'cheque_number', type: 'varchar', length: 100, nullable: true })
  chequeNumber: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING, APPROVED, REJECTED, REVERSED

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
