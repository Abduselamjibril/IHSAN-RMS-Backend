import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('crm_opportunity_loss_reason')
export class OpportunityLossReason {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'reason_name', type: 'varchar', length: 150, unique: true })
  reasonName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
