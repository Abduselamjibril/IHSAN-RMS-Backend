import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { WorkflowDefinition } from './workflow-definition.entity';
import { User } from '../../security/entities/user.entity';
import { WorkflowApproval } from './workflow-approval.entity';
import { WorkflowHistory } from './workflow-history.entity';

@Entity('rems_workflow_instance')
export class WorkflowInstance {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'workflowinstanceid' })
  workflowInstanceId: string;

  @Column({ name: 'workflowdefinitionid', type: 'bigint' })
  workflowDefinitionId: string;

  @Column({ name: 'referencetypeid', length: 50 })
  referenceTypeId: string; // PROPERTY, CUSTOMER, RESERVATION, SALES_CONTRACT, DISCOUNT, COMMISSION, PAYMENT

  @Column({ name: 'referenceid', type: 'bigint' })
  referenceId: string;

  @Column({ name: 'currentstepnumber', type: 'integer' })
  currentStepNumber: number;

  @Index('IX_WorkflowInstance_Status')
  @Column({ name: 'workflowstatusid', length: 50 })
  workflowStatusId: string; // PENDING, APPROVED, REJECTED, RETURNED, ESCALATED

  @Column({ name: 'initiatedby', type: 'bigint' })
  initiatedBy: string;

  @CreateDateColumn({ name: 'initiateddate', type: 'timestamp' })
  initiatedDate: Date;

  @ManyToOne(() => WorkflowDefinition, (definition) => definition.instances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowdefinitionid' })
  workflowDefinition: WorkflowDefinition;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'initiatedby' })
  initiator: User;

  @OneToMany(() => WorkflowApproval, (approval) => approval.workflowInstance)
  approvals: WorkflowApproval[];

  @OneToMany(() => WorkflowHistory, (history) => history.workflowInstance)
  history: WorkflowHistory[];
}
