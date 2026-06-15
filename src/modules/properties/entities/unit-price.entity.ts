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

@Entity('rems_unit_price')
@Index('idx_rems_unit_price_unit', ['unit'])
@Index('idx_rems_unit_active_price', ['unit'], { where: 'is_active = true' })
export class UnitPrice {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Unit)
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'base_price', type: 'numeric', precision: 18, scale: 2 })
  basePrice: number;

  @Column({ name: 'price_per_sqm', type: 'numeric', precision: 18, scale: 2, nullable: true })
  pricePerSqm: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'ETB' })
  currencyCode: string;

  @Column({ name: 'tax_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  taxPercentage: number;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ name: 'final_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  finalPrice: number;

  @Column({ name: 'is_negotiable', type: 'boolean', default: false })
  isNegotiable: boolean;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;
}
