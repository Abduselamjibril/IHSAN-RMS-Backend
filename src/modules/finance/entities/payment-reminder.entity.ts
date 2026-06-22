import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { SalesContract } from '../../sales/entities/sales-contract.entity';
import { InstallmentSchedule } from '../../sales/entities/installment-schedule.entity';
import { Customer } from '../../crm/entities/customer.entity';

@Entity('rems_payment_reminder')
export class PaymentReminder {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'payment_reminder_id' })
  id: number;

  @ManyToOne(() => SalesContract, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract: SalesContract;

  @ManyToOne(() => InstallmentSchedule, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'installment_id' })
  installment: InstallmentSchedule;

  @ManyToOne(() => Customer, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'notification_type', type: 'varchar', length: 50, nullable: true })
  notificationType: string; // SMS, EMAIL, TELEGRAM

  @Column({ name: 'reminder_date', type: 'timestamptz', nullable: true })
  reminderDate: Date;

  @Column({ name: 'delivery_status', type: 'varchar', length: 50, nullable: true })
  deliveryStatus: string; // SENT, FAILED

  @Column({ name: 'message_content', type: 'text', nullable: true })
  messageContent: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
