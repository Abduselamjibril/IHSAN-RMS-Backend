import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InstallmentPlan } from './installment-plan.entity';

@Entity('installment_schedule')
export class InstallmentSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'installment_id' })
  id: number;

  @ManyToOne(() => InstallmentPlan, (plan) => plan.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: InstallmentPlan;

  @Column({ name: 'installment_no', type: 'integer', nullable: true })
  installmentNo: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'installment_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  installmentAmount: number;

  @Column({ name: 'paid_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ name: 'outstanding_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  outstandingAmount: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string; // PENDING, PARTIAL, PAID, OVERDUE

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate: Date;
}
