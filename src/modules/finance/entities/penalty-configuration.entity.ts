import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_penalty_configuration')
export class PenaltyConfiguration {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'penalty_configuration_id' })
  id: number;

  @Column({ name: 'project_id', type: 'bigint', nullable: true })
  projectId: number;

  @Column({ name: 'grace_period_days', type: 'integer', default: 0 })
  gracePeriodDays: number;

  @Column({ name: 'penalty_type', type: 'varchar', length: 50, nullable: true })
  penaltyType: string; // FIXED, PERCENTAGE, MONTHLY

  @Column({ name: 'penalty_percentage', type: 'numeric', precision: 10, scale: 4, nullable: true })
  penaltyPercentage: number;

  @Column({ name: 'fixed_penalty_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fixedPenaltyAmount: number;

  @Column({ name: 'monthly_penalty_rate', type: 'numeric', precision: 10, scale: 4, nullable: true })
  monthlyPenaltyRate: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
