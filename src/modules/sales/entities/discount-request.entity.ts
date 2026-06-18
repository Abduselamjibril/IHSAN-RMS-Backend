import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SalesQuotation } from './sales-quotation.entity';

@Entity('discount_request')
@Index('idx_discount_request_quotation', ['quotation'])
export class DiscountRequest {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'request_id' })
  id: number;

  @ManyToOne(() => SalesQuotation, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'quotation_id' })
  quotation: SalesQuotation | null;

  @Column({ name: 'requested_discount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  requestedDiscount: number;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // PENDING, APPROVED, REJECTED

  @Column({ name: 'requested_by', type: 'bigint', nullable: true, default: 1 })
  requestedBy: number;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;
}
