import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';

@Entity('rems_penalty_transaction')
@Index('idx_rems_penalty_installment', ['installment'])
export class PenaltyTransaction {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'penalty_transaction_id' })
  id: number;

  @ManyToOne(() => InstallmentSchedule, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'installment_id' })
  installment: InstallmentSchedule;

  @Column({ name: 'penalty_date', type: 'date', nullable: true })
  penaltyDate: Date;

  @Column({ name: 'penalty_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  penaltyAmount: number;

  @Column({ type: 'boolean', default: false })
  waived: boolean;

  @Column({ name: 'waived_by', type: 'bigint', nullable: true })
  waivedBy: number;

  @Column({ name: 'waiver_reason', type: 'text', nullable: true })
  waiverReason: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
