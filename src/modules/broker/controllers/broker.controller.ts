import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BrokerService } from '../services/broker.service';
import {
  CreateBrokerDto,
  UpdateBrokerDto,
  CreateBrokerBankAccountDto,
  AssignProjectDto,
  AssignLeadDto,
  CreateCommissionPlanDto,
  AssignProjectCommissionPlanDto,
  CreateBrokerSaleDto,
  CreateAdjustmentDto,
  RecordPaymentDto,
  SetTargetDto,
} from '../dto/broker.dto';

@ApiTags('Broker')
@Controller('api/brokers')
export class BrokerController {
  constructor(private readonly brokerService: BrokerService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get overall broker dashboard metrics & leaderboard' })
  async getDashboardStats() {
    return this.brokerService.getDashboardStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all brokers list' })
  async getBrokers() {
    return this.brokerService.getBrokers();
  }

  @Get('commission-plans/all')
  @ApiOperation({ summary: 'Get all commission plans' })
  async getCommissionPlans() {
    return this.brokerService.getCommissionPlans();
  }

  @Get('commission-plans/:id')
  @ApiOperation({ summary: 'Get commission plan by ID' })
  async getCommissionPlanById(@Param('id', ParseIntPipe) id: number) {
    return this.brokerService.getCommissionPlanById(id);
  }

  @Get('sales/all')
  @ApiOperation({ summary: 'Get all attributable sales' })
  async getSalesAttributed() {
    return this.brokerService.getSalesAttributed();
  }

  @Get('commissions/all')
  @ApiOperation({ summary: 'Get all calculated broker commissions' })
  async getCommissions() {
    return this.brokerService.getCommissions();
  }

  @Get('payments/all')
  @ApiOperation({ summary: 'Get all payouts logged' })
  async getPayments() {
    return this.brokerService.getPayments();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broker profile details (including assignments)' })
  async getBrokerById(@Param('id', ParseIntPipe) id: number) {
    return this.brokerService.getBrokerById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new broker' })
  async createBroker(@Body() dto: CreateBrokerDto) {
    return this.brokerService.createBroker(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update broker profile' })
  async updateBroker(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrokerDto,
  ) {
    return this.brokerService.updateBroker(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate broker profile' })
  async deleteBroker(@Param('id', ParseIntPipe) id: number) {
    return this.brokerService.deleteBroker(id);
  }

  // --- Bank Accounts ---
  @Post(':id/bank-accounts')
  @ApiOperation({ summary: 'Add bank payment details for a broker' })
  async addBankAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBrokerBankAccountDto,
  ) {
    return this.brokerService.addBankAccount(id, dto);
  }

  @Delete(':id/bank-accounts/:accountId')
  @ApiOperation({ summary: 'Remove bank payment details' })
  async deleteBankAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.brokerService.deleteBankAccount(id, accountId);
    return { message: 'Bank account details removed successfully' };
  }

  // --- Documents Upload ---
  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload broker licensing or identity document' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const rand = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${rand}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async addDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
    @Body() body: { documentTypeId: string; documentName: string; expiryDate?: string },
  ) {
    return this.brokerService.addDocument(id, file, body);
  }

  @Delete(':id/documents/:docId')
  @ApiOperation({ summary: 'Remove broker document' })
  async deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
  ) {
    await this.brokerService.deleteDocument(id, docId);
    return { message: 'Document removed successfully' };
  }

  // --- Scoping / Project Assignments ---
  @Post(':id/projects')
  @ApiOperation({ summary: 'Assign a broker to a property / project' })
  async assignProject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignProjectDto,
  ) {
    return this.brokerService.assignProject(id, dto);
  }

  @Delete(':id/projects/:assignmentId')
  @ApiOperation({ summary: 'Deassign a project from a broker' })
  async removeProjectAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    await this.brokerService.removeProjectAssignment(id, assignmentId);
    return { message: 'Project assignment removed' };
  }

  // --- Lead Assignments ---
  @Post(':id/leads')
  @ApiOperation({ summary: 'Assign a CRM lead to a broker' })
  async assignLead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignLeadDto,
  ) {
    return this.brokerService.assignLead(id, dto);
  }

  @Delete(':id/leads/:assignmentId')
  @ApiOperation({ summary: 'Remove lead assignment' })
  async removeLeadAssignment(
    @Param('id', ParseIntPipe) id: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    await this.brokerService.removeLeadAssignment(id, assignmentId);
    return { message: 'Lead assignment deactivated' };
  }

  // --- Commission Plans Master Setup ---
  @Post('commission-plans')
  @ApiOperation({ summary: 'Create a new commission plan' })
  async createCommissionPlan(@Body() dto: CreateCommissionPlanDto) {
    return this.brokerService.createCommissionPlan(dto);
  }

  @Post('commission-plans/projects')
  @ApiOperation({ summary: 'Map a commission plan to a project' })
  async assignProjectCommissionPlan(@Body() dto: AssignProjectCommissionPlanDto) {
    return this.brokerService.assignProjectCommissionPlan(dto);
  }

  @Get('commission-plans/projects/:propertyId')
  @ApiOperation({ summary: 'Get commission plan mapping for a specific project' })
  async getProjectCommissionPlans(@Param('propertyId', ParseIntPipe) propertyId: number) {
    return this.brokerService.getProjectCommissionPlans(propertyId);
  }

  // --- Sales Attributions ---
  @Post('sales')
  @ApiOperation({ summary: 'Manually attribute a sale to a broker and trigger commission calculation' })
  async logBrokerSale(@Body() dto: CreateBrokerSaleDto) {
    return this.brokerService.logBrokerSale(dto);
  }

  // --- Commission Approvals & Adjustments ---
  @Post('commissions/:id/approve')
  @ApiOperation({ summary: 'Approve a calculated commission for payment processing' })
  async approveCommission(@Param('id', ParseIntPipe) id: number) {
    return this.brokerService.approveCommission(id, 'MANAGER');
  }

  @Post('commissions/:id/adjust')
  @ApiOperation({ summary: 'Record manual commission increase or decrease' })
  async addAdjustment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateAdjustmentDto,
  ) {
    return this.brokerService.addAdjustment(id, dto, 'MANAGER');
  }

  // --- Payments Payouts ---
  @Post('payments')
  @ApiOperation({ summary: 'Record payment disbursements' })
  async recordPayment(@Body() dto: RecordPaymentDto) {
    return this.brokerService.recordPayment(dto);
  }

  // --- Broker Performance Targets ---
  @Post(':id/targets')
  @ApiOperation({ summary: 'Configure targets for a broker' })
  async setTarget(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTargetDto,
  ) {
    return this.brokerService.setTarget(id, dto);
  }

  @Get(':id/targets')
  @ApiOperation({ summary: 'Get targets historical configuration' })
  async getTargets(@Param('id', ParseIntPipe) id: number) {
    return this.brokerService.getTargets(id);
  }
}
