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

@Entity('rems_unit_price_history')
@Index('idx_rems_unit_price_history_price', ['unitPrice'])
export class UnitPriceHistory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => UnitPrice)
  @JoinColumn({ name: 'unit_price_id' })
  unitPrice: UnitPrice;

  @Column({ name: 'old_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  oldPrice: number;

  @Column({ name: 'new_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  newPrice: number;

  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true, default: 1 })
  changedBy: number;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
