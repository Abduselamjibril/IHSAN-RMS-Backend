import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity('rems_price_change_request')
@Index('idx_rems_price_change_request_unit', ['unit'])
@Index('idx_rems_price_change_request_status', ['status'])
export class PriceChangeRequest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Unit, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'current_price', type: 'numeric', precision: 18, scale: 2 })
  currentPrice: number;

  @Column({ name: 'proposed_price', type: 'numeric', precision: 18, scale: 2 })
  proposedPrice: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'ETB' })
  currencyCode: string;

  @Column({ name: 'is_negotiable', type: 'boolean', default: false })
  isNegotiable: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: string; // PENDING, APPROVED, REJECTED

  @Column({ name: 'requested_by', type: 'bigint', nullable: true, default: 1 })
  requestedBy: number;

  @Column({ name: 'requested_by_name', type: 'varchar', length: 150, nullable: true })
  requestedByName: string;

  @CreateDateColumn({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt: Date;

  @Column({ name: 'reviewed_by', type: 'bigint', nullable: true })
  reviewedBy: number | null;

  @Column({ name: 'reviewed_by_name', type: 'varchar', length: 150, nullable: true })
  reviewedByName: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string | null;
}
