import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from '../../crm/entities/customer.entity';
import { Property } from '../../properties/entities/property.entity';
import { Unit } from '../../properties/entities/unit.entity';

@Entity('sales_reservation')
@Index('idx_sales_reservation_no', ['reservationNo'], { unique: true })
@Index('idx_sales_reservation_customer', ['customer'])
@Index('idx_sales_reservation_property', ['property'])
@Index('idx_sales_reservation_unit', ['unit'])
export class SalesReservation {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'reservation_id' })
  id: number;

  @Column({ name: 'reservation_no', type: 'varchar', length: 50, unique: true })
  reservationNo: string;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Property, { eager: true })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ManyToOne(() => Unit, { eager: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'reservation_date', type: 'timestamp' })
  reservationDate: Date;

  @Column({ name: 'expiry_date', type: 'timestamp' })
  expiryDate: Date;

  @Column({ name: 'reservation_fee', type: 'numeric', precision: 18, scale: 2, nullable: true })
  reservationFee: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ type: 'varchar', length: 30 })
  status: string; // RESERVED, EXPIRED, CANCELLED, CONVERTED_TO_BOOKING

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'bigint', default: 1 })
  createdBy: number;

  @UpdateDateColumn({ name: 'modified_at', type: 'timestamp', nullable: true })
  modifiedAt: Date;

  @Column({ name: 'modified_by', type: 'bigint', nullable: true })
  modifiedBy: number;
}
