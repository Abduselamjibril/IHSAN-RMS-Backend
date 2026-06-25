import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('rems_broker_target')
export class BrokerTarget {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_target_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'year_number', type: 'integer' })
  yearNumber: number;

  @Column({ name: 'month_number', type: 'integer' })
  monthNumber: number;

  @Column({ name: 'sales_target_count', type: 'integer' })
  salesTargetCount: number;

  @Column({ name: 'sales_target_amount', type: 'numeric', precision: 18, scale: 2 })
  salesTargetAmount: number;

  @Column({ name: 'commission_target', type: 'numeric', precision: 18, scale: 2, nullable: true })
  commissionTarget: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
