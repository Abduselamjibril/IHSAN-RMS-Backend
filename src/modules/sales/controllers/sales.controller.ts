import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SalesService } from '../services/sales.service';
import {
  CreateCustomerDto,
  CreateReservationDto,
  ExtendReservationDto,
  CreateQuotationDto,
  CreateBookingDto,
  CreateAgreementDto,
  CreateContractDto,
  CreateInstallmentPlanDto,
  CreateDiscountRequestDto,
  CreateCommissionRuleDto,
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

  // --- Reservations ---
  @Post('reservations')
  createReservation(@Body() dto: CreateReservationDto) {
    return this.service.createReservation(dto);
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
  cancelReservation(@Param('id') id: string) {
    return this.service.cancelReservation(+id);
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

  @Put('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.service.cancelBooking(+id);
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

  // --- Contracts ---
  @Post('contracts')
  createContract(@Body() dto: CreateContractDto) {
    return this.service.createContract(dto);
  }

  @Get('contracts')
  findAllContracts() {
    return this.service.findAllContracts();
  }

  @Post('contracts/:id/document')
  uploadContractDocument(
    @Param('id') id: string,
    @Body('fileName') fileName: string,
    @Body('filePath') filePath: string,
  ) {
    return this.service.uploadContractDocument(+id, fileName, filePath);
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
    return this.service.updateInstallmentPayment(+id, paidAmount);
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

  @Put('discounts/:id/approve')
  approveDiscountRequest(
    @Param('id') id: string,
    @Body('approverId') approverId: number,
    @Body('comment') comment: string,
  ) {
    return this.service.approveDiscountRequest(+id, approverId || 1, comment || 'Approved');
  }

  @Put('discounts/:id/reject')
  rejectDiscountRequest(
    @Param('id') id: string,
    @Body('approverId') approverId: number,
    @Body('comment') comment: string,
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

  // --- Dashboard ---
  @Get('dashboard/stats')
  getSalesDashboardStats() {
    return this.service.getSalesDashboardStats();
  }
}
