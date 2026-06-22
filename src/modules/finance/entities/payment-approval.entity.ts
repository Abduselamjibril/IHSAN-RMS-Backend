import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';

@Entity('rems_payment_approval')
export class PaymentApproval {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payment_approval_id' })
  id: number;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'approval_status', type: 'varchar', length: 50 })
  approvalStatus: string; // PENDING, APPROVED, REJECTED

  @Column({ name: 'approval_comment', type: 'text', nullable: true })
  approvalComment: string;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy: number;

  @Column({ name: 'approval_date', type: 'timestamptz', nullable: true })
  approvalDate: Date;
}
