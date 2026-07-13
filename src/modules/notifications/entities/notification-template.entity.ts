import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { NotificationCategory } from './notification-category.entity';
import { NotificationChannel } from './notification-channel.entity';
import { NotificationTemplateVariable } from './notification-template-variable.entity';

@Entity('rems_notification_template')
export class NotificationTemplate {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_template_id' })
  id: number;

  @ManyToOne(() => NotificationCategory, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'notification_category_id' })
  category: NotificationCategory;

  @Column({ name: 'template_code', type: 'varchar', length: 100, unique: true })
  templateCode: string;

  @Column({ name: 'template_name', type: 'varchar', length: 250 })
  templateName: string;

  @Column({ name: 'subject_template', type: 'varchar', length: 500, nullable: true })
  subjectTemplate: string | null;

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate: string;

  @ManyToOne(() => NotificationChannel, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'notification_channel_id' })
  channel: NotificationChannel;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 50, default: 'Admin' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => NotificationTemplateVariable, (v) => v.template, { cascade: true })
  variables: NotificationTemplateVariable[];
}
