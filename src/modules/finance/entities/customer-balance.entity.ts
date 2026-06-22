import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesContract } from '../../sales/entities/sales-contract.entity';

@Entity('rems_customer_balance')
@Index('idx_rems_customer_balance_customer', ['customer'])
export class CustomerBalance {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'customer_balance_id' })
  id: number;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => SalesContract, { eager: true })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @Column({ name: 'contract_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ name: 'total_paid', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPaid: number;

  @Column({ name: 'total_penalty', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPenalty: number;

  @Column({ name: 'outstanding_balance', type: 'numeric', precision: 18, scale: 2, nullable: true })
  outstandingBalance: number;

  @Column({ name: 'last_updated', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastUpdated: Date;
}
