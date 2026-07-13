import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';

@Entity('rems_notification_template_variable')
export class NotificationTemplateVariable {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'notification_template_variable_id' })
  id: number;

  @ManyToOne(() => NotificationTemplate, (t) => t.variables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notification_template_id' })
  template: NotificationTemplate;

  @Column({ name: 'variable_name', type: 'varchar', length: 100 })
  variableName: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;
}
