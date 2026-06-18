import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SalesContract } from './sales-contract.entity';
import { SalesAgent } from '../../crm/entities/sales-agent.entity';
import { SalesCommissionRule } from './sales-commission-rule.entity';

@Entity('sales_commission')
@Index('idx_sales_commission_contract', ['contract'])
@Index('idx_sales_commission_agent', ['salesRep'])
export class SalesCommission {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'commission_id' })
  id: number;

  @ManyToOne(() => SalesContract, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @ManyToOne(() => SalesAgent, { eager: true })
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep: SalesAgent;

  @ManyToOne(() => SalesCommissionRule, { eager: true, nullable: true })
  @JoinColumn({ name: 'commission_rule_id' })
  commissionRule: SalesCommissionRule | null;

  @Column({ name: 'sale_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  saleAmount: number;

  @Column({ name: 'commission_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  commissionAmount: number;

  @Column({ type: 'varchar', length: 30, nullable: true })
  status: string; // PENDING, APPROVED, PAID

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
