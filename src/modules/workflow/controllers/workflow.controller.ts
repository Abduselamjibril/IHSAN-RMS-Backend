import { Controller, Get, Post, Body, Headers, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';
import { CreateWorkflowDefinitionDto, SubmitWorkflowDto, ProcessApprovalDto } from '../dto/workflow.dto';
import { verifyToken } from '../../security/utils/security.crypto';

@ApiTags('Workflow')
@Controller('api/workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('definitions')
  @ApiOperation({ summary: 'Create or update workflow approval step sequencer' })
  async createDefinition(@Body() dto: CreateWorkflowDefinitionDto) {
    return this.workflowService.createDefinition(dto);
  }

  @Get('definitions')
  @ApiOperation({ summary: 'Get all configured workflow sequencers' })
  async getDefinitions() {
    return this.workflowService.getDefinitions();
  }

  @Post('submit')
  @ApiOperation({ summary: 'Submit an entity item for workflow approvals tracking' })
  async submitWorkflow(@Body() dto: SubmitWorkflowDto) {
    return this.workflowService.submitToWorkflow(dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get list of active approval workflow vouchers' })
  async getActiveInstances() {
    return this.workflowService.getActiveInstances();
  }

  @Post('approvals')
  @ApiOperation({ summary: 'Process approval action on a workflow step' })
  async processApprovalAction(@Body() dto: ProcessApprovalDto, @Headers('authorization') authHeader: string) {
    if (!authHeader) throw new BadRequestException('Authorization header is required');
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) throw new BadRequestException('Invalid or expired authorization token');

    return this.workflowService.processApprovalAction(dto, decoded.userId);
  }
}
