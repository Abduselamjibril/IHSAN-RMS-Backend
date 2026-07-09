import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class WorkflowStepDto {
  @IsNumber()
  stepNumber: number;

  @IsString()
  @IsNotEmpty()
  stepName: string;

  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsNumber()
  @IsOptional()
  approvalThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class CreateWorkflowDefinitionDto {
  @IsString()
  @IsNotEmpty()
  workflowCode: string; // PROPERTY_APPROVAL, SALE_APPROVAL, DISCOUNT_APPROVAL, etc.

  @IsString()
  @IsNotEmpty()
  workflowName: string;

  @IsString()
  @IsNotEmpty()
  moduleName: string;

  @IsArray()
  steps: WorkflowStepDto[];
}

export class SubmitWorkflowDto {
  @IsString()
  @IsNotEmpty()
  workflowCode: string;

  @IsString()
  @IsNotEmpty()
  referenceTypeId: string; // PROPERTY, CUSTOMER, RESERVATION, DISCOUNT, etc.

  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsString()
  @IsNotEmpty()
  initiatorId: string;
}

export class ProcessApprovalDto {
  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @IsString()
  @IsNotEmpty()
  actionId: string; // APPROVED, REJECTED, RETURNED, ESCALATED

  @IsString()
  @IsOptional()
  remarks?: string;
}
