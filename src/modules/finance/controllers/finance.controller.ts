import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FinanceService } from '../services/finance.service';
import {
  CreatePaymentMethodDto,
  CreatePaymentDto,
  ApprovePaymentDto,
  CreateReceiptTemplateDto,
  CreatePenaltyConfigDto,
  WaivePenaltyDto,
  CreateReminderConfigDto,
} from '../dto/finance.dto';

@ApiTags('Payment & Financial Management')
@Controller('api/finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // --- Payment Methods ---
  @Get('payment-methods')
  getPaymentMethods() {
    return this.service.getPaymentMethods();
  }

  @Post('payment-methods')
  createPaymentMethod(@Body() dto: CreatePaymentMethodDto) {
    return this.service.createPaymentMethod(dto);
  }

  // --- Payments Collections ---
  @Post('payments')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.service.createPayment(dto);
  }

  @Get('payments')
  getPayments(@Query() query: any) {
    return this.service.getPayments(query);
  }

  @Get('payments/:id')
  getPayment(@Param('id') id: string) {
    return this.service.getPayment(+id);
  }

  @Put('payments/:id/approve')
  approvePayment(@Param('id') id: string, @Body() dto: ApprovePaymentDto) {
    return this.service.approvePayment(+id, 1, dto); // Default User ID = 1
  }

  @Put('payments/:id/reject')
  rejectPayment(@Param('id') id: string, @Body() dto: ApprovePaymentDto) {
    return this.service.rejectPayment(+id, 1, dto); // Default User ID = 1
  }

  @Put('payments/:id/reverse')
  reversePayment(@Param('id') id: string, @Body('comment') comment: string) {
    return this.service.reversePayment(+id, 1, comment); // Default User ID = 1
  }

  // --- Reschedule Installments ---
  @Put('installments/:id/reschedule')
  rescheduleInstallment(
    @Param('id') id: string,
    @Body('dueDate') dueDate: string,
    @Body('amount') amount: number,
  ) {
    return this.service.rescheduleInstallment(+id, dueDate, amount);
  }

  // --- Penalties ---
  @Get('penalties/config')
  getPenaltyConfigs() {
    return this.service.getPenaltyConfigs();
  }

  @Post('penalties/config')
  createPenaltyConfig(@Body() dto: CreatePenaltyConfigDto) {
    return this.service.createPenaltyConfig(dto);
  }

  @Delete('penalties/config/:id')
  deletePenaltyConfig(@Param('id') id: string) {
    return this.service.deletePenaltyConfig(+id);
  }

  @Post('penalties/calculate-daily')
  runDailyPenaltySweeper() {
    return this.service.runDailyPenaltySweeper();
  }

  @Get('penalties/transactions')
  getPenaltyTransactions() {
    return this.service.getPenaltyTransactions();
  }

  @Post('penalties/waive/:id')
  waivePenalty(@Param('id') id: string, @Body() dto: WaivePenaltyDto) {
    return this.service.waivePenalty(+id, 1, dto); // Default User ID = 1
  }

  // --- Receipts & Templates ---
  @Get('receipt-templates')
  getReceiptTemplates() {
    return this.service.getReceiptTemplates();
  }

  @Put('receipt-templates/:id')
  updateReceiptTemplate(@Param('id') id: string, @Body() dto: CreateReceiptTemplateDto) {
    return this.service.updateReceiptTemplate(+id, dto);
  }

  @Get('receipts')
  getReceipts() {
    return this.service.getReceipts();
  }

  @Post('receipts/:id/reprint')
  reprintReceipt(@Param('id') id: string) {
    return this.service.reprintReceipt(+id);
  }

  // --- Customer Outstanding Balances & Analytical Reports ---
  @Get('balances')
  getCustomerBalances() {
    return this.service.getCustomerBalances();
  }

  @Get('statements/customer/:customerId')
  getCustomerStatement(@Param('customerId') customerId: string) {
    return this.service.getCustomerStatement(+customerId);
  }

  @Get('reports/aging')
  getAgingAnalysis() {
    return this.service.getAgingAnalysis();
  }

  @Get('reports/collections')
  getRevenueSummary() {
    return this.service.getRevenueSummary();
  }

  // --- Reminders ---
  @Get('reminders/config')
  getReminderConfigs() {
    return this.service.getReminderConfigs();
  }

  @Post('reminders/config')
  updateReminderConfig(@Body() dto: CreateReminderConfigDto) {
    return this.service.updateReminderConfig(dto);
  }

  @Get('reminders/logs')
  getReminderLogs() {
    return this.service.getReminderLogs();
  }

  @Post('reminders/trigger')
  triggerReminderEngine() {
    return this.service.triggerReminderEngine();
  }

  // --- Global Organization Settings & User Signatures ---
  @Get('settings')
  getSettings() {
    return this.service.getSettings();
  }

  @Post('settings')
  updateSettings(@Body() dto: any) {
    return this.service.updateSettings(dto);
  }

  @Get('users/signature')
  getUserSignature() {
    return this.service.getUserSignature();
  }

  @Post('users/signature')
  updateUserSignature(@Body() dto: { signature_png_base64: string }) {
    return this.service.updateUserSignature(dto);
  }
}
