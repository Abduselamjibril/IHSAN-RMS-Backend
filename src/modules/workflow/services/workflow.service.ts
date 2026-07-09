import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowApproval } from '../entities/workflow-approval.entity';
import { WorkflowHistory } from '../entities/workflow-history.entity';
import { CreateWorkflowDefinitionDto, SubmitWorkflowDto, ProcessApprovalDto } from '../dto/workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(WorkflowDefinition) private readonly defRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStep) private readonly stepRepo: Repository<WorkflowStep>,
    @InjectRepository(WorkflowInstance) private readonly instanceRepo: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowApproval) private readonly approvalRepo: Repository<WorkflowApproval>,
    @InjectRepository(WorkflowHistory) private readonly historyRepo: Repository<WorkflowHistory>,
  ) {}

  async createDefinition(dto: CreateWorkflowDefinitionDto) {
    let def = await this.defRepo.findOne({ where: { workflowCode: dto.workflowCode } });
    if (!def) {
      def = this.defRepo.create({
        workflowCode: dto.workflowCode,
        workflowName: dto.workflowName,
        moduleName: dto.moduleName,
        isActive: true,
      });
      def = await this.defRepo.save(def);
    } else {
      def.workflowName = dto.workflowName;
      def.moduleName = dto.moduleName;
      def = await this.defRepo.save(def);
      // Wipe steps for re-creation
      await this.stepRepo.delete({ workflowDefinitionId: def.workflowDefinitionId });
    }

    if (dto.steps && dto.steps.length > 0) {
      for (const step of dto.steps) {
        const stepEntity = this.stepRepo.create({
          workflowDefinitionId: def.workflowDefinitionId,
          stepNumber: step.stepNumber,
          stepName: step.stepName,
          roleId: step.roleId,
          approvalThreshold: step.approvalThreshold,
          isMandatory: step.isMandatory !== undefined ? step.isMandatory : true,
        });
        await this.stepRepo.save(stepEntity);
      }
    }

    return this.defRepo.findOne({ where: { workflowDefinitionId: def.workflowDefinitionId }, relations: { steps: { role: true } } });
  }

  async getDefinitions() {
    return this.defRepo.find({
      relations: { steps: { role: true } },
      order: { workflowDefinitionId: 'ASC' },
    });
  }

  async submitToWorkflow(dto: SubmitWorkflowDto) {
    const def = await this.defRepo.findOne({ where: { workflowCode: dto.workflowCode } });
    if (!def) throw new NotFoundException(`Workflow definition for code ${dto.workflowCode} not found`);

    // Check if there is already an active instance for this reference
    const existing = await this.instanceRepo.findOne({
      where: {
        workflowDefinitionId: def.workflowDefinitionId,
        referenceTypeId: dto.referenceTypeId,
        referenceId: dto.referenceId,
        workflowStatusId: 'PENDING',
      },
    });
    if (existing) {
      return existing; // Already pending approval
    }

    const instance = this.instanceRepo.create({
      workflowDefinitionId: def.workflowDefinitionId,
      referenceTypeId: dto.referenceTypeId,
      referenceId: dto.referenceId,
      currentStepNumber: 1,
      workflowStatusId: 'PENDING',
      initiatedBy: dto.initiatorId,
    });

    const saved = await this.instanceRepo.save(instance);

    // Save history
    const history = this.historyRepo.create({
      workflowInstanceId: saved.workflowInstanceId,
      previousStatusId: null,
      newStatusId: 'PENDING',
      changedBy: dto.initiatorId,
    });
    await this.historyRepo.save(history);

    return saved;
  }

  async getActiveInstances() {
    return this.instanceRepo.find({
      where: { workflowStatusId: 'PENDING' },
      relations: {
        workflowDefinition: { steps: { role: true } },
        initiator: true,
        approvals: { approver: true, workflowStep: true },
        history: { changedByUser: true },
      },
      order: { initiatedDate: 'DESC' },
    });
  }

  async processApprovalAction(dto: ProcessApprovalDto, userId: string) {
    const instance = await this.instanceRepo.findOne({
      where: { workflowInstanceId: dto.instanceId },
      relations: { workflowDefinition: { steps: true } },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');

    const steps = instance.workflowDefinition.steps.sort((a, b) => a.stepNumber - b.stepNumber);
    const currentStep = steps.find((s) => s.stepNumber === instance.currentStepNumber);
    if (!currentStep) throw new BadRequestException('Invalid active workflow step configuration');

    // Create approval record
    const approval = this.approvalRepo.create({
      workflowInstanceId: instance.workflowInstanceId,
      workflowStepId: currentStep.workflowStepId,
      approverUserId: userId,
      approvalActionId: dto.actionId,
      approvalRemarks: dto.remarks,
    });
    await this.approvalRepo.save(approval);

    const oldStatus = instance.workflowStatusId;

    if (dto.actionId === 'APPROVED') {
      const nextStep = steps.find((s) => s.stepNumber === instance.currentStepNumber + 1);
      if (nextStep) {
        // Go to next level
        instance.currentStepNumber = nextStep.stepNumber;
        instance.workflowStatusId = 'PENDING';
      } else {
        // Fully approved
        instance.workflowStatusId = 'APPROVED';
      }
    } else if (dto.actionId === 'REJECTED') {
      instance.workflowStatusId = 'REJECTED';
    } else if (dto.actionId === 'RETURNED') {
      instance.workflowStatusId = 'RETURNED';
      instance.currentStepNumber = 1; // Send back to step 1
    } else if (dto.actionId === 'ESCALATED') {
      instance.workflowStatusId = 'ESCALATED';
    }

    await this.instanceRepo.save(instance);

    // Save history
    const history = this.historyRepo.create({
      workflowInstanceId: instance.workflowInstanceId,
      previousStatusId: oldStatus,
      newStatusId: instance.workflowStatusId,
      changedBy: userId,
    });
    await this.historyRepo.save(history);

    return instance;
  }
}
