import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Broker } from './broker.entity';

@Entity('rems_broker_bank_account')
export class BrokerBankAccount {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'broker_bank_account_id' })
  id: number;

  @ManyToOne(() => Broker, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'broker_id' })
  broker: Broker;

  @Column({ name: 'bank_name', type: 'varchar', length: 250 })
  bankName: string;

  @Column({ name: 'account_name', type: 'varchar', length: 250 })
  accountName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 100 })
  accountNumber: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'SYSTEM' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz' })
  createdAt: Date;
}
