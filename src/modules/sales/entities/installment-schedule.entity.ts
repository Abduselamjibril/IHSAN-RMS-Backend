import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesContract } from './sales-contract.entity';

@Entity('rems_installment_schedule')
export class InstallmentSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'installment_id' })
  id: number;

  @ManyToOne(() => SalesContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @Column({ name: 'installment_no', type: 'integer' })
  installmentNo: number;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'installment_amount', type: 'numeric', precision: 18, scale: 2 })
  installmentAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'outstanding_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  outstandingAmount: number;

  @Column({ name: 'penalty_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  penaltyAmount: number;

  @Column({ name: 'installment_status', type: 'varchar', length: 50, default: 'PENDING' })
  status: string; // PENDING, PARTIAL, PAID, OVERDUE, WAIVED

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
