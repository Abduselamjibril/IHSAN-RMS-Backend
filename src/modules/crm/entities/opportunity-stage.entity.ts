import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('crm_opportunity_stage')
export class OpportunityStage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'stage_name', type: 'varchar', length: 100, unique: true })
  stageName: string;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder: number;

  @Column({ name: 'probability_percent', type: 'numeric', precision: 5, scale: 2, nullable: true })
  probabilityPercent: number;

  @Column({ name: 'color_code', type: 'varchar', length: 20, nullable: true })
  colorCode: string;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
