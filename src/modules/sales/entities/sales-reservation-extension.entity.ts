import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesReservation } from './sales-reservation.entity';

@Entity('sales_reservation_extension')
export class SalesReservationExtension {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'extension_id' })
  id: number;

  @ManyToOne(() => SalesReservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: SalesReservation;

  @Column({ name: 'previous_expiry_date', type: 'timestamp', nullable: true })
  previousExpiryDate: Date;

  @Column({ name: 'new_expiry_date', type: 'timestamp', nullable: true })
  newExpiryDate: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
