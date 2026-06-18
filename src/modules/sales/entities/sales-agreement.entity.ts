import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesBooking } from './sales-booking.entity';

@Entity('sales_agreement')
@Index('idx_sales_agreement_no', ['agreementNo'], { unique: true })
@Index('idx_sales_agreement_booking', ['booking'])
@Index('idx_sales_agreement_customer', ['customer'])
export class SalesAgreement {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'agreement_id' })
  id: number;

  @Column({ name: 'agreement_no', type: 'varchar', length: 50, unique: true })
  agreementNo: string;

  @ManyToOne(() => SalesBooking, { eager: true })
  @JoinColumn({ name: 'booking_id' })
  booking: SalesBooking;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'agreement_date', type: 'date', nullable: true })
  agreementDate: Date;

  @Column({ name: 'agreement_version', type: 'integer', default: 1 })
  agreementVersion: number;

  @Column({ name: 'agreement_document', type: 'text', nullable: true })
  agreementDocument: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // DRAFT, ACTIVE, REVISED, TERMINATED

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
