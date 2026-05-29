import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('crm_lead_status')
export class LeadStatus {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'status_name', type: 'varchar', length: 50, unique: true })
  statusName: string;

  @Column({ name: 'color_code', type: 'varchar', length: 20, nullable: true })
  colorCode: string;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  sortOrder: number;

  @Column({ name: 'is_closed', type: 'boolean', default: false })
  isClosed: boolean;

  @Column({ name: 'is_converted', type: 'boolean', default: false })
  isConverted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
