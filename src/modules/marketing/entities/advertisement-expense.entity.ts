import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Advertisement } from './advertisement.entity';

@Entity('rems_advertisement_expense')
@Index('idx_advertisement_expense_date', ['expenseDate'])
export class AdvertisementExpense {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'advertisement_expense_id' })
  id: number;

  @ManyToOne(() => Advertisement, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement: Advertisement;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ name: 'expense_type', type: 'varchar', length: 100, nullable: true })
  expenseType: string;

  @Column({ name: 'expense_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  expenseAmount: number;

  @Column({ name: 'vendor_name', type: 'varchar', length: 200, nullable: true })
  vendorName: string;

  @Column({ name: 'payment_reference', type: 'varchar', length: 100, nullable: true })
  paymentReference: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}
