import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SalesContract } from './sales-contract.entity';
import { InstallmentSchedule } from './installment-schedule.entity';

@Entity('installment_plan')
export class InstallmentPlan {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'plan_id' })
  id: number;

  @ManyToOne(() => SalesContract, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @Column({ name: 'total_contract_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalContractAmount: number;

  @Column({ name: 'down_payment', type: 'numeric', precision: 18, scale: 2, nullable: true })
  downPayment: number;

  @Column({ name: 'installment_frequency', type: 'varchar', length: 20, nullable: true })
  installmentFrequency: string; // MONTHLY, QUARTERLY, YEARLY

  @Column({ name: 'number_of_installments', type: 'integer', nullable: true })
  numberOfInstallments: number;

  @OneToMany(() => InstallmentSchedule, (schedule) => schedule.plan, { cascade: true, eager: true })
  schedules: InstallmentSchedule[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
