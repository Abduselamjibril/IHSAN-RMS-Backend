import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';
import { User } from '../../security/entities/user.entity';

@Entity('rems_workflow_history')
export class WorkflowHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'workflowhistoryid' })
  workflowHistoryId: string;

  @Column({ name: 'workflowinstanceid', type: 'bigint' })
  workflowInstanceId: string;

  @Column({ type: 'varchar', name: 'previousstatusid', length: 50, nullable: true })
  previousStatusId: string | null;

  @Column({ name: 'newstatusid', length: 50 })
  newStatusId: string;

  @Column({ name: 'changedby', type: 'bigint' })
  changedBy: string;

  @CreateDateColumn({ name: 'changeddate', type: 'timestamp' })
  changedDate: Date;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowinstanceid' })
  workflowInstance: WorkflowInstance;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changedby' })
  changedByUser: User;
}
