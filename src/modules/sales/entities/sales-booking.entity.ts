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
import { Property } from '../../properties/entities/property.entity';
import { Unit } from '../../properties/entities/unit.entity';
import { SalesReservation } from './sales-reservation.entity';
import { SalesQuotation } from './sales-quotation.entity';

@Entity('sales_booking')
@Index('idx_sales_booking_no', ['bookingNo'], { unique: true })
@Index('idx_sales_booking_customer', ['customer'])
@Index('idx_sales_booking_property', ['property'])
@Index('idx_sales_booking_unit', ['unit'])
export class SalesBooking {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'booking_id' })
  id: number;

  @Column({ name: 'booking_no', type: 'varchar', length: 50, unique: true })
  bookingNo: string;

  @ManyToOne(() => SalesReservation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: SalesReservation | null;

  @ManyToOne(() => SalesQuotation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quotation_id' })
  quotation: SalesQuotation | null;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Unit, { eager: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'booking_date', type: 'date', nullable: true })
  bookingDate: Date;

  @Column({ name: 'booking_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  bookingAmount: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // PENDING, APPROVED, CANCELLED, CONTRACT_CREATED

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
