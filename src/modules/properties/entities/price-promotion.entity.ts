import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Property } from './property.entity';
import { UnitType } from './unit-type.entity';

@Entity('rems_price_promotion')
@Index('idx_rems_price_promotion_property', ['applicableProperty'])
@Index('idx_rems_price_promotion_unit_type', ['applicableUnitType'])
@Index('idx_rems_price_promotion_dates', ['startDate', 'endDate'])
export class PricePromotion {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'promotion_name', type: 'varchar', length: 200 })
  promotionName: string;

  @Column({ name: 'promotion_type', type: 'varchar', length: 50, nullable: true })
  promotionType: string;

  @Column({ name: 'discount_percentage', type: 'numeric', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ name: 'fixed_discount_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  fixedDiscountAmount: number;

  @ManyToOne(() => Property, { nullable: true })
  @JoinColumn({ name: 'applicable_property_id' })
  applicableProperty: Property;

  @ManyToOne(() => UnitType, { nullable: true })
  @JoinColumn({ name: 'applicable_unit_type_id' })
  applicableUnitType: UnitType;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;
}
