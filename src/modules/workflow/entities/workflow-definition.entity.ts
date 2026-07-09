import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowInstance } from './workflow-instance.entity';

@Entity('rems_workflow_definition')
export class WorkflowDefinition {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'workflowdefinitionid' })
  workflowDefinitionId: string;

  @Column({ name: 'workflowcode', length: 50, unique: true })
  workflowCode: string; // PROPERTY_APPROVAL, SALE_APPROVAL, DISCOUNT_APPROVAL, PAYMENT_APPROVAL, COMMISSION_APPROVAL

  @Column({ name: 'workflowname', length: 250 })
  workflowName: string;

  @Column({ name: 'modulename', length: 100 })
  moduleName: string;

  @Column({ name: 'isactive', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => WorkflowStep, (step) => step.workflowDefinition)
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowInstance, (instance) => instance.workflowDefinition)
  instances: WorkflowInstance[];
}
