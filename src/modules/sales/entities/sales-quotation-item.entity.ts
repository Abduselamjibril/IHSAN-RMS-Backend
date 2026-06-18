import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SalesQuotation } from './sales-quotation.entity';

@Entity('sales_quotation_item')
export class SalesQuotationItem {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'quotation_item_id' })
  id: number;

  @ManyToOne(() => SalesQuotation, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' })
  quotation: SalesQuotation;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 18, scale: 2, nullable: true })
  amount: number;
}
