import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReportTemplate } from './report-template.entity';

@Entity('rems_report_schedule')
export class ReportSchedule {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => ReportTemplate, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_template_id' })
  reportTemplate: ReportTemplate;

  @Column({ name: 'recipient_email', type: 'varchar', length: 250 })
  recipientEmail: string;

  @Column({ type: 'varchar', length: 30 }) // DAILY, WEEKLY, MONTHLY
  frequency: string;

  @Column({ type: 'simple-json', nullable: true })
  filters: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
