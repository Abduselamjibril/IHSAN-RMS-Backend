import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';
import { ReceiptTemplate } from './receipt-template.entity';

@Entity('rems_receipt')
export class Receipt {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'receipt_id' })
  id: number;

  @Column({ name: 'receipt_number', type: 'varchar', length: 100, unique: true, nullable: true })
  receiptNumber: string;

  @ManyToOne(() => Payment, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => ReceiptTemplate, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receipt_template_id' })
  receiptTemplate: ReceiptTemplate | null;

  @Column({ name: 'receipt_date', type: 'timestamptz', nullable: true })
  receiptDate: Date;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ name: 'generated_by', type: 'bigint', nullable: true, default: 1 })
  generatedBy: number;

  @CreateDateColumn({ name: 'generated_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
