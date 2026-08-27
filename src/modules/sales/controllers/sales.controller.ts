import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { ApiTags } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateReservationDto,
  ExtendReservationDto,
  CreateQuotationDto,
  EmailQuotationDto,
  ConvertReservationDto,
  CreateBookingDto,
  RejectBookingDto,
  FinanceReviewBookingDto,
  CancelBookingDto,
  CreateAgreementDto,
  CreateContractDto,
  CreateInstallmentPlanDto,
  CreateDiscountRequestDto,
  CreateCommissionRuleDto,
  UpdateAgreementVersionDto,
  UpdateContractStatusDto,
  CreateContractAmendmentDto,
  SendInstallmentReminderDto,
  ReviewCommissionDto,
} from '../dto/sales.dto';

@ApiTags('Sales Management')
@Controller('api/sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  // --- Customers ---
  @Post('customers')
  createCustomer(@Body() dto: CreateCustomerDto) {
    return this.service.createCustomer(dto);
  }

  @Get('customers')
  findAllCustomers() {
    return this.service.findAllCustomers();
  }

  @Get('customers/:id')
  findOneCustomer(@Param('id') id: string) {
    return this.service.findOneCustomer(+id);
  }

  @Put('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.updateCustomer(+id, dto);
  }

  @Delete('customers/:id')
  deleteCustomer(@Param('id') id: string) {
    return this.service.deleteCustomer(+id);
  }

  // --- Reservations ---
  @Post('reservations')
  createReservation(@Body() dto: CreateReservationDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.createReservation(dto, userId, username);
  }

  @Get('reservations')
  findAllReservations() {
    return this.service.findAllReservations();
  }

  @Post('reservations/extend')
  extendReservation(@Body() dto: ExtendReservationDto) {
    return this.service.extendReservation(dto);
  }

  @Post('reservations/process-expired')
  processExpiredReservations() {
    return this.service.processExpiredReservations();
  }

  @Put('reservations/:id/cancel')
  cancelReservation(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.cancelReservation(+id, userId, username);
  }

  // --- Quotations ---
  @Get('pricing/calculate')
  calculateQuotationPrice(
    @Query('propertyId') propertyId: string,
    @Query('unitId') unitId: string,
  ) {
    return this.service.calculateQuotationPrice(+propertyId, +unitId);
  }

  @Post('quotations')
  createQuotation(@Body() dto: CreateQuotationDto) {
    return this.service.createQuotation(dto);
  }

  @Get('quotations')
  findAllQuotations() {
    return this.service.findAllQuotations();
  }

  @Post('quotations/:id/email')
  sendQuotationEmail(@Param('id') id: string, @Body() dto: EmailQuotationDto) {
    return this.service.sendQuotationEmail(+id, dto);
  }

  // --- Reservations Conversion ---
  @Post('reservations/:id/convert-to-booking')
  convertReservationToBooking(@Param('id') id: string, @Body() dto: ConvertReservationDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.convertReservationToBooking(+id, dto, userId, username);
  }

  // --- Bookings ---
  @Post('bookings')
  createBooking(@Body() dto: CreateBookingDto) {
    return this.service.createBooking(dto);
  }

  @Get('bookings')
  findAllBookings() {
    return this.service.findAllBookings();
  }

  @Put('bookings/:id/approve')
  approveBooking(@Param('id') id: string, @Body('approverId') approverId: number) {
    return this.service.approveBooking(+id, approverId || 1);
  }

  @Put('bookings/:id/reject')
  rejectBooking(@Param('id') id: string, @Body() dto: RejectBookingDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.rejectBooking(+id, dto, userId, username);
  }

  @Put('bookings/:id/finance-review')
  financeReviewBooking(@Param('id') id: string, @Body() dto: FinanceReviewBookingDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.financeReviewBooking(+id, dto, userId, username);
  }

  @Put('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string, @Body() dto: CancelBookingDto, @Req() req: any) {
    const user = req.user;
    const userId = user?.userId || 1;
    const username = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'System' : 'System';
    return this.service.cancelBooking(+id, dto, userId, username);
  }

  // --- Agreements ---
  @Post('agreements')
  createAgreement(@Body() dto: CreateAgreementDto) {
    return this.service.createAgreement(dto);
  }

  @Get('agreements')
  findAllAgreements() {
    return this.service.findAllAgreements();
  }

  @Put('agreements/:id/version')
  updateAgreementVersion(@Param('id') id: string, @Body() dto: UpdateAgreementVersionDto) {
    return this.service.updateAgreementVersion(+id, dto);
  }

  @Get('agreements/:id/history')
  getAgreementHistory(@Param('id') id: string) {
    return this.service.getAgreementHistory(+id);
  }

  // --- Contracts ---
  @Post('contracts')
  createContract(@Body() dto: CreateContractDto) {
    return this.service.createContract(dto);
  }

  @Get('contracts')
  findAllContracts() {
    return this.service.findAllContracts();
  }

  @Put('contracts/:id/status')
  updateContractStatus(@Param('id') id: string, @Body() dto: UpdateContractStatusDto) {
    return this.service.updateContractStatus(+id, dto);
  }

  @Post('contracts/:id/amendments')
  createContractAmendment(@Param('id') id: string, @Body() dto: CreateContractAmendmentDto) {
    return this.service.createContractAmendment(+id, dto);
  }

  @Get('contracts/:id/amendments')
  getContractAmendments(@Param('id') id: string) {
    return this.service.getContractAmendments(+id);
  }

  @Post('contracts/:id/document')
  uploadContractDocument(
    @Param('id') id: string,
    @Body('fileName') fileName: string,
    @Body('filePath') filePath: string,
  ) {
    return this.service.uploadContractDocument(+id, fileName, filePath);
  }

  @Post('contracts/:id/document/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dest = './uploads/contracts';
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'];
      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'text/csv', 'text/plain'
      ];
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException(`Unsupported file type: ${ext}`), false);
      }
      cb(null, true);
    }
  }))
  async uploadContractFile(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body('fileName') fileName: string,
  ) {
    if (!file) throw new BadRequestException('File is required.');
    const filePath = `/uploads/contracts/${file.filename}`;
    return this.service.uploadContractDocument(+id, fileName || file.originalname, filePath);
  }

  @Delete('contracts/documents/:id')
  removeContractDocument(@Param('id') id: string) {
    return this.service.removeContractDocument(+id);
  }

  // --- Installments ---
  @Post('installments/plan')
  generateInstallmentPlan(@Body() dto: CreateInstallmentPlanDto) {
    return this.service.generateInstallmentPlan(dto);
  }

  @Get('installments/plans')
  getInstallmentPlans() {
    return this.service.getInstallmentPlans();
  }

  @Put('installments/schedules/:id/pay')
  updateInstallmentPayment(
    @Param('id') id: string,
    @Body('paidAmount') paidAmount: number,
  ) {
    return this.service.payInstallment(+id, paidAmount);
  }

  @Post('installments/:id/remind')
  sendInstallmentReminder(
    @Param('id') id: string,
    @Body() dto: SendInstallmentReminderDto,
  ) {
    return this.service.sendInstallmentReminder(+id, dto);
  }

  // --- Discounts ---
  @Post('discounts')
  createDiscountRequest(@Body() dto: CreateDiscountRequestDto) {
    return this.service.createDiscountRequest(dto);
  }

  @Get('discounts')
  getDiscountRequests() {
    return this.service.getDiscountRequests();
  }

  @Get('discounts/:id/history')
  getDiscountHistory(@Param('id') id: string) {
    return this.service.getDiscountHistory(+id);
  }

  @Put('discounts/:id/approve')
  approveDiscountRequest(
    @Param('id') id: string,
    @Body('approverId') approverId?: number,
    @Body('comment') comment?: string,
  ) {
    return this.service.approveDiscountRequest(+id, approverId || 1, comment || 'Approved');
  }

  @Put('discounts/:id/reject')
  rejectDiscountRequest(
    @Param('id') id: string,
    @Body('approverId') approverId?: number,
    @Body('comment') comment?: string,
  ) {
    return this.service.rejectDiscountRequest(+id, approverId || 1, comment || 'Rejected');
  }

  // --- Commissions ---
  @Post('commissions/rules')
  createCommissionRule(@Body() dto: CreateCommissionRuleDto) {
    return this.service.createCommissionRule(dto);
  }

  @Get('commissions/rules')
  getCommissionRules() {
    return this.service.getCommissionRules();
  }

  @Get('commissions')
  getCommissions() {
    return this.service.getCommissions();
  }

  @Get('commissions/report')
  getCommissionsReport(
    @Query('agentId') agentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getCommissionsReport({
      agentId: agentId ? +agentId : undefined,
      startDate,
      endDate,
      status,
    });
  }

  @Put('commissions/:id/review')
  reviewCommission(
    @Param('id') id: string,
    @Body() dto: ReviewCommissionDto,
  ) {
    return this.service.reviewCommission(+id, dto.action, dto.remarks, dto.reviewerId);
  }

  @Post('commissions/calculate/:contractId')
  calculateCommission(@Param('contractId') contractId: string) {
    return this.service.calculateCommissions(+contractId);
  }

  @Patch('commissions/:id/status')
  updateCommissionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.service.updateCommissionStatus(+id, status);
  }

  @Patch('contracts/:id/terminate')
  terminateContract(
    @Param('id') id: string,
  ) {
    return this.service.terminateContract(+id);
  }

  // --- Dashboard ---
  @Get('dashboard/stats')
  getSalesDashboardStats() {
    return this.service.getSalesDashboardStats();
  }
}
