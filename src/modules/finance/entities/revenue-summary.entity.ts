import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_revenue_summary')
export class RevenueSummary {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'revenue_summary_id' })
  id: number;

  @Column({ name: 'reporting_date', type: 'date', nullable: true })
  reportingDate: Date;

  @Column({ name: 'project_id', type: 'bigint', nullable: true })
  projectId: number;

  @Column({ name: 'total_collections', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalCollections: number;

  @Column({ name: 'total_penalties', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalPenalties: number;

  @Column({ name: 'total_revenue', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ name: 'total_outstanding', type: 'numeric', precision: 18, scale: 2, default: 0 })
  totalOutstanding: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
