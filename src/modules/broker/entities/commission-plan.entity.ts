import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CommissionPlanDetail } from './commission-plan-detail.entity';

@Entity('rems_commission_plan')
export class CommissionPlan {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'commission_plan_id' })
  id: number;

  @Column({ name: 'commission_plan_code', type: 'varchar', length: 50, unique: true })
  commissionPlanCode: string;

  @Column({ name: 'commission_plan_name', type: 'varchar', length: 250 })
  commissionPlanName: string;

  @Column({ name: 'commission_type_id', type: 'varchar', length: 50 })
  commissionTypeId: string; // PERCENTAGE, FIXED, TIERED

  @Column({ name: 'status_id', type: 'varchar', length: 50, default: 'ACTIVE' })
  statusId: string; // ACTIVE, INACTIVE

  @Column({ name: 'effective_from_date', type: 'timestamptz' })
  effectiveFromDate: Date;

  @Column({ name: 'effective_to_date', type: 'timestamptz', nullable: true })
  effectiveToDate: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => CommissionPlanDetail, (detail) => detail.commissionPlan, { cascade: true })
  details: CommissionPlanDetail[];
}
