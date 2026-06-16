import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Lead } from './lead.entity';
import { CustomerDocumentVersion } from './customer-document-version.entity';

@Entity('crm_customer_document')
export class CustomerDocument {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Lead, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ name: 'document_code', type: 'varchar', length: 30, unique: true })
  documentCode: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // Passport, National ID, Contract, Receipt, KYC, Signed Agreement

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date | null;

  @Column({ name: 'is_expired', type: 'boolean', default: false })
  isExpired: boolean;

  @Column({ name: 'access_role', type: 'varchar', length: 50, nullable: true })
  accessRole: string | null; // e.g., Sales, Legal, Manager

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @OneToMany(() => CustomerDocumentVersion, (version) => version.document, { cascade: true })
  versions: CustomerDocumentVersion[];
}
