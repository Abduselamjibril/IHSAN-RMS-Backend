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
import { Property } from '../../properties/entities/property.entity';
import { SalesAgreement } from './sales-agreement.entity';
import { SalesContractDocument } from './sales-contract-document.entity';

@Entity('rems_sales_contract')
@Index('idx_rems_sales_contract_number', ['contractNo'], { unique: true })
@Index('idx_rems_sales_contract_agreement', ['agreement'])
@Index('idx_rems_sales_contract_customer', ['customer'])
@Index('idx_rems_sales_contract_property', ['property'])
export class SalesContract {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'contract_id' })
  id: number;

  @Column({ name: 'contract_number', type: 'varchar', length: 100, unique: true })
  contractNo: string;

  @ManyToOne(() => SalesAgreement, { eager: true, nullable: true })
  @JoinColumn({ name: 'agreement_id' })
  agreement: SalesAgreement | null;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @Column({ name: 'contract_date', type: 'date', nullable: true })
  contractStartDate: Date;

  @Column({ name: 'contract_end_date', type: 'date', nullable: true })
  contractEndDate: Date;

  @Column({ name: 'property_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ name: 'down_payment', type: 'numeric', precision: 18, scale: 2, default: 0 })
  downPayment: number;

  @Column({ name: 'total_installments', type: 'integer', default: 0 })
  totalInstallments: number;

  @Column({ name: 'installment_frequency', type: 'varchar', length: 50, nullable: true })
  installmentFrequency: string;

  @Column({ name: 'contract_status', type: 'varchar', length: 50, nullable: true })
  status: string; // ACTIVE, SUSPENDED, COMPLETED, TERMINATED

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => SalesContractDocument, (doc) => doc.contract, { cascade: true, eager: true })
  documents: SalesContractDocument[];

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
