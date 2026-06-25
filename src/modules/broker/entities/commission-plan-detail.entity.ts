import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CommissionPlan } from './commission-plan.entity';

@Entity('rems_commission_plan_detail')
export class CommissionPlanDetail {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'commission_plan_detail_id' })
  id: number;

  @ManyToOne(() => CommissionPlan, (plan) => plan.details, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_plan_id' })
  commissionPlan: CommissionPlan;

  @Column({ name: 'from_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fromAmount?: number | null;

  @Column({ name: 'to_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  toAmount?: number | null;

  @Column({ name: 'from_units', type: 'integer', nullable: true })
  fromUnits?: number | null;

  @Column({ name: 'to_units', type: 'integer', nullable: true })
  toUnits?: number | null;

  @Column({ name: 'commission_percent', type: 'numeric', precision: 18, scale: 4, nullable: true })
  commissionPercent?: number | null;

  @Column({ name: 'fixed_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fixedAmount?: number | null;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
