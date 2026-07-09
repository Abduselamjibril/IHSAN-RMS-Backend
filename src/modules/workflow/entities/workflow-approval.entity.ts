import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowStep } from './workflow-step.entity';
import { User } from '../../security/entities/user.entity';

@Entity('rems_workflow_approval')
export class WorkflowApproval {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'workflowapprovalid' })
  workflowApprovalId: string;

  @Index('IX_WorkflowApproval_WorkflowInstance')
  @Column({ name: 'workflowinstanceid', type: 'bigint' })
  workflowInstanceId: string;

  @Column({ name: 'workflowstepid', type: 'bigint' })
  workflowStepId: string;

  @Column({ name: 'approveruserid', type: 'bigint' })
  approverUserId: string;

  @Column({ name: 'approvalactionid', length: 50 })
  approvalActionId: string; // APPROVED, REJECTED, RETURNED, ESCALATED

  @Column({ name: 'approvalremarks', length: 2000, nullable: true })
  approvalRemarks: string;

  @CreateDateColumn({ name: 'approvaldate', type: 'timestamp' })
  approvalDate: Date;

  @ManyToOne(() => WorkflowInstance, (instance) => instance.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowinstanceid' })
  workflowInstance: WorkflowInstance;

  @ManyToOne(() => WorkflowStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowstepid' })
  workflowStep: WorkflowStep;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approveruserid' })
  approver: User;
}
