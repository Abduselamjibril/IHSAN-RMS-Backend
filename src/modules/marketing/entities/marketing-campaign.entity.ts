import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('rems_marketing_campaign')
@Index('idx_campaign_status', ['campaignStatus'])
@Index('idx_campaign_dates', ['startDate', 'endDate'])
export class MarketingCampaign {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'campaign_id' })
  id: number;

  @Column({ name: 'campaign_code', type: 'varchar', length: 50, unique: true })
  campaignCode: string;

  @Column({ name: 'campaign_name', type: 'varchar', length: 200 })
  campaignName: string;

  @Column({ name: 'campaign_type', type: 'varchar', length: 50 })
  campaignType: string; // DIGITAL, SOCIAL_MEDIA, PRINT_MEDIA, BILLBOARD, RADIO, TELEVISION, EMAIL, EVENT, REFERRAL

  @Column({ name: 'campaign_objective', type: 'text', nullable: true })
  campaignObjective: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'budget_amount', type: 'numeric', precision: 18, scale: 2, default: 0 })
  budgetAmount: number;

  @Column({ name: 'target_audience', type: 'varchar', length: 200, nullable: true })
  targetAudience: string;

  @Column({ name: 'campaign_status', type: 'varchar', length: 50, default: 'DRAFT' })
  campaignStatus: string; // DRAFT, PLANNED, ACTIVE, SUSPENDED, COMPLETED, CANCELLED

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy: number;

  @UpdateDateColumn({ name: 'updated_date', type: 'timestamptz', nullable: true })
  updatedDate: Date;
}
