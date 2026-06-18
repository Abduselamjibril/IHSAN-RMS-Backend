import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sales_commission_rule')
export class SalesCommissionRule {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'rule_id' })
  id: number;

  @Column({ name: 'commission_name', type: 'varchar', length: 100, nullable: true })
  commissionName: string;

  @Column({ name: 'commission_type', type: 'varchar', length: 20, nullable: true })
  commissionType: string; // PERCENTAGE, FIXED

  @Column({ name: 'commission_value', type: 'numeric', precision: 18, scale: 2, nullable: true })
  commissionValue: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
