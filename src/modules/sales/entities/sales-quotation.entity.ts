import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../crm/entities/customer.entity';
import { SalesReservation } from './sales-reservation.entity';
import { Property } from '../../properties/entities/property.entity';
import { Unit } from '../../properties/entities/unit.entity';
import { SalesQuotationItem } from './sales-quotation-item.entity';

@Entity('sales_quotation')
@Index('idx_sales_quotation_no', ['quotationNo'], { unique: true })
@Index('idx_sales_quotation_customer', ['customer'])
@Index('idx_sales_quotation_property', ['property'])
@Index('idx_sales_quotation_unit', ['unit'])
export class SalesQuotation {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'quotation_id' })
  id: number;

  @Column({ name: 'quotation_no', type: 'varchar', length: 50, unique: true })
  quotationNo: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => SalesReservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: SalesReservation | null;

  @ManyToOne(() => Property, { eager: true, nullable: true })
  @JoinColumn({ name: 'property_id' })
  property: Property | null;

  @ManyToOne(() => Unit, { eager: true, nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit | null;

  @Column({ name: 'quotation_date', type: 'date' })
  quotationDate: Date;

  @Column({ name: 'validity_date', type: 'date' })
  validityDate: Date;

  @Column({ name: 'base_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  basePrice: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  discountAmount: number;

  @Column({ name: 'vat_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  vatAmount: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalAmount: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // DRAFT, SENT, ACCEPTED, EXPIRED, REJECTED

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => SalesQuotationItem, (item) => item.quotation, { cascade: true, eager: true })
  items: SalesQuotationItem[];

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
