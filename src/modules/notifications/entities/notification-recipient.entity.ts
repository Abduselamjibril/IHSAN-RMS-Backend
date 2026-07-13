import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Notification as NotificationEntity } from './notification.entity';

@Entity('rems_notification_recipient')
export class NotificationRecipient {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_recipient_id' })
  id: number;

  @ManyToOne(() => NotificationEntity, (n) => n.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_id' })
  notification: NotificationEntity;

  @Column({ name: 'user_id', type: 'bigint', nullable: true })
  userId: number | null; // reference to user account if internal user

  @Column({ name: 'recipient_name', type: 'varchar', length: 250, nullable: true })
  recipientName: string | null;

  @Column({ name: 'email_address', type: 'varchar', length: 250, nullable: true })
  emailAddress: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'push_token', type: 'varchar', length: 1000, nullable: true })
  pushToken: string | null;

  @Column({ name: 'delivery_status_id', type: 'varchar', length: 50, default: 'PENDING' })
  deliveryStatus: string; // 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'

  @Column({ name: 'delivered_date', type: 'timestamptz', nullable: true })
  deliveredDate: Date | null;

  @Column({ name: 'read_date', type: 'timestamptz', nullable: true })
  readDate: Date | null;
}
