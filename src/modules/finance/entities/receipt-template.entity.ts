import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_receipt_template')
export class ReceiptTemplate {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'receipt_template_id' })
  id: number;

  @Column({ name: 'template_name', type: 'varchar', length: 200, nullable: true })
  templateName: string;

  @Column({ name: 'company_logo', type: 'text', nullable: true })
  companyLogo: string;

  @Column({ name: 'header_text', type: 'text', nullable: true })
  headerText: string;

  @Column({ name: 'footer_text', type: 'text', nullable: true })
  footerText: string;

  @Column({ name: 'signature_text', type: 'text', nullable: true })
  signatureText: string;

  @Column({ name: 'qr_enabled', type: 'boolean', default: true })
  qrEnabled: boolean;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
