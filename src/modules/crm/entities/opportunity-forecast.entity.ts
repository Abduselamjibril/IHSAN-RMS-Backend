import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';

@Entity('crm_opportunity_forecast')
export class OpportunityForecast {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Opportunity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

  @Column({ name: 'forecast_month', type: 'date', nullable: true })
  forecastMonth: Date;

  @Column({ name: 'expected_revenue', type: 'numeric', precision: 18, scale: 2, nullable: true })
  expectedRevenue: number;

  @Column({ name: 'probability_percent', type: 'numeric', precision: 5, scale: 2, nullable: true })
  probabilityPercent: number;

  @Column({ name: 'forecast_notes', type: 'text', nullable: true })
  forecastNotes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
