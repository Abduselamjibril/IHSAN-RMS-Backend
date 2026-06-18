import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesAgreement } from './sales-agreement.entity';
import { SalesContractDocument } from './sales-contract-document.entity';

@Entity('sales_contract')
@Index('idx_sales_contract_no', ['contractNo'], { unique: true })
@Index('idx_sales_contract_agreement', ['agreement'])
@Index('idx_sales_contract_customer', ['customer'])
export class SalesContract {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'contract_id' })
  id: number;

  @Column({ name: 'contract_no', type: 'varchar', length: 50, unique: true })
  contractNo: string;

  @ManyToOne(() => SalesAgreement, { eager: true })
  @JoinColumn({ name: 'agreement_id' })
  agreement: SalesAgreement;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'contract_start_date', type: 'date', nullable: true })
  contractStartDate: Date;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contractEndDate: Date;

  @Column({ name: 'contract_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // ACTIVE, SUSPENDED, COMPLETED, TERMINATED

  @OneToMany(() => SalesContractDocument, (doc) => doc.contract, { cascade: true, eager: true })
  documents: SalesContractDocument[];

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
