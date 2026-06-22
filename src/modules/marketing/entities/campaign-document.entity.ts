import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MarketingCampaign } from './marketing-campaign.entity';

@Entity('rems_campaign_document')
export class CampaignDocument {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'campaign_document_id' })
  id: number;

  @ManyToOne(() => MarketingCampaign, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ name: 'file_name', type: 'varchar', length: 500, nullable: true })
  fileName: string;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath: string;

  @Column({ name: 'file_type', type: 'varchar', length: 100, nullable: true })
  fileType: string;

  @Column({ name: 'uploaded_by', type: 'bigint', nullable: true, default: 1 })
  uploadedBy: number;

  @CreateDateColumn({ name: 'uploaded_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  uploadedDate: Date;
}
