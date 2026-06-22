import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rems_notification_template')
export class NotificationTemplate {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_template_id' })
  id: number;

  @Column({ name: 'template_name', type: 'varchar', length: 200, nullable: true })
  templateName: string;

  @Column({ name: 'notification_type', type: 'varchar', length: 50, nullable: true })
  notificationType: string; // SMS, EMAIL, TELEGRAM

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
