import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CommissionPlan } from './commission-plan.entity';
import { Property } from '../../properties/entities/property.entity';

@Entity('rems_project_commission_plan')
export class ProjectCommissionPlan {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'project_commission_plan_id' })
  id: number;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => CommissionPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commission_plan_id' })
  commissionPlan: CommissionPlan;

  @Column({ name: 'effective_from_date', type: 'timestamptz' })
  effectiveFromDate: Date;

  @Column({ name: 'effective_to_date', type: 'timestamptz', nullable: true })
  effectiveToDate: Date;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
