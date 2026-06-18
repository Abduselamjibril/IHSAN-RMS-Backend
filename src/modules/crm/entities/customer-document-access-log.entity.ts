import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerDocument } from './customer-document.entity';

@Entity('crm_customer_document_access_log')
export class CustomerDocumentAccessLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => CustomerDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: CustomerDocument;

  @Column({ type: 'varchar', length: 50 })
  action: string; // Upload, View, Download, Replace

  @Column({ name: 'performed_by', type: 'bigint', nullable: true })
  performedBy: number;

  @CreateDateColumn({ name: 'accessed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  accessedAt: Date;
}
