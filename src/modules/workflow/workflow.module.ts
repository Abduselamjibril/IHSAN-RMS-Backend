import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowApproval } from './entities/workflow-approval.entity';
import { WorkflowHistory } from './entities/workflow-history.entity';
import { WorkflowService } from './services/workflow.service';
import { WorkflowController } from './controllers/workflow.controller';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowDefinition,
      WorkflowStep,
      WorkflowInstance,
      WorkflowApproval,
      WorkflowHistory,
    ]),
    SecurityModule,
  ],
  providers: [WorkflowService],
  controllers: [WorkflowController],
  exports: [WorkflowService, TypeOrmModule],
})
export class WorkflowModule {}
