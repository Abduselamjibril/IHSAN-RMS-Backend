import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rems_payment_method')
export class PaymentMethod {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payment_method_id' })
  id: number;

  @Column({ name: 'payment_method_name', type: 'varchar', length: 100 })
  paymentMethodName: string;

  @Column({ name: 'payment_method_code', type: 'varchar', length: 50, unique: true })
  paymentMethodCode: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, default: 1 })
  createdBy: number;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
