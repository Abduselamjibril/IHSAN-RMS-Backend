import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DiscountRequest } from './discount-request.entity';

@Entity('discount_approval_history')
export class DiscountApprovalHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'approval_id' })
  id: number;

  @ManyToOne(() => DiscountRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: DiscountRequest;

  @Column({ name: 'approver_id', type: 'bigint', nullable: true })
  approverId: number;

  @Column({ name: 'approval_level', type: 'integer', nullable: true })
  approvalLevel: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  action: string; // APPROVED, REJECTED

  @Column({ type: 'text', nullable: true })
  comments: string;

  @CreateDateColumn({ name: 'action_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  actionDate: Date;
}
