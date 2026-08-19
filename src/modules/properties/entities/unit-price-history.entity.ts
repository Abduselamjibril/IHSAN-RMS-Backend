import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UnitPrice } from './unit-price.entity';
import { Unit } from './unit.entity';

@Entity('rems_unit_price_history')
@Index('idx_rems_unit_price_history_unit', ['unit'])
@Index('idx_rems_unit_price_history_price', ['unitPrice'])
export class UnitPriceHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Unit, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @ManyToOne(() => UnitPrice, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'unit_price_id' })
  unitPrice: UnitPrice;

  @Column({ name: 'old_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  oldPrice: number;

  @Column({ name: 'new_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  newPrice: number;

  @Column({ name: 'currency_code', type: 'varchar', length: 10, default: 'ETB' })
  currencyCode: string;

  @Column({ name: 'is_negotiable', type: 'boolean', default: false })
  isNegotiable: boolean;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true, default: 1 })
  changedBy: number;

  @Column({ name: 'changed_by_name', type: 'varchar', length: 150, nullable: true })
  changedByName: string;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
