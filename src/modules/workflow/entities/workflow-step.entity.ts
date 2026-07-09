import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { WorkflowDefinition } from './workflow-definition.entity';
import { Role } from '../../security/entities/role.entity';

@Entity('rems_workflow_step')
export class WorkflowStep {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'workflowstepid' })
  workflowStepId: string;

  @Column({ name: 'workflowdefinitionid', type: 'bigint' })
  workflowDefinitionId: string;

  @Column({ name: 'stepnumber', type: 'integer' })
  stepNumber: number;

  @Column({ name: 'stepname', length: 250 })
  stepName: string;

  @Column({ name: 'roleid', type: 'bigint' })
  roleId: string;

  @Column({ name: 'approvalthreshold', type: 'decimal', precision: 18, scale: 2, nullable: true })
  approvalThreshold: number;

  @Column({ name: 'ismandatory', type: 'boolean', default: true })
  isMandatory: boolean;

  @ManyToOne(() => WorkflowDefinition, (definition) => definition.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowdefinitionid' })
  workflowDefinition: WorkflowDefinition;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleid' })
  role: Role;
}
