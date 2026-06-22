import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';

@Entity('rems_payment_allocation')
export class PaymentAllocation {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payment_allocation_id' })
  id: number;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => InstallmentSchedule, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'installment_id' })
  installment: InstallmentSchedule;

  @Column({ name: 'allocated_amount', type: 'numeric', precision: 18, scale: 2 })
  allocatedAmount: number;

  @CreateDateColumn({ name: 'allocation_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  allocationDate: Date;
}
