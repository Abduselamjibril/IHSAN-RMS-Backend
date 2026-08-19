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

  @Column({ type: 'varchar', length: 30, nullable: true, default: 'PENDING_SALES' })
  status: string; // PENDING_SALES, PENDING_FINANCE, APPROVED, REJECTED, CANCELLED, CONTRACT_CREATED

  @Column({ name: 'approval_stage', type: 'varchar', length: 50, nullable: true, default: 'PENDING_SALES' })
  approvalStage: string;

  @Column({ name: 'sales_approved_by', type: 'bigint', nullable: true })
  salesApprovedBy: number;

  @Column({ name: 'sales_approved_at', type: 'timestamp', nullable: true })
  salesApprovedAt: Date;

  @Column({ name: 'finance_approved_by', type: 'bigint', nullable: true })
  financeApprovedBy: number;

  @Column({ name: 'finance_approved_at', type: 'timestamp', nullable: true })
  financeApprovedAt: Date;

  @Column({ name: 'finance_comment', type: 'text', nullable: true })
  financeComment: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
