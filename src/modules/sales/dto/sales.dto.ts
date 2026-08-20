import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: '+251911223344' })
  primaryPhone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'Ethiopian' })
  nationality?: string;

  @ApiPropertyOptional({ example: 1 })
  leadId?: number;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John Doe Update' })
  fullName?: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  primaryPhone?: string;

  @ApiPropertyOptional({ example: 'john.update@example.com' })
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'Ethiopian' })
  nationality?: string;
}

export class CreateReservationDto {
  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiProperty({ example: 1 })
  propertyId: number;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiProperty({ example: '2026-06-15T12:00:00Z' })
  reservationDate: Date;

  @ApiProperty({ example: '2026-06-25T12:00:00Z' })
  expiryDate: Date;

  @ApiPropertyOptional({ example: 10000.00 })
  reservationFee?: number;

  @ApiPropertyOptional({ example: 'Client needs 10 days to pay down payment' })
  remarks?: string;
}

export class ExtendReservationDto {
  @ApiProperty({ example: 1 })
  reservationId: number;

  @ApiProperty({ example: '2026-07-05T12:00:00Z' })
  newExpiryDate: Date;

  @ApiProperty({ example: 'Client requested extension due to bank transfer delays' })
  reason: string;
}

export class CreateQuotationItemDto {
  @ApiProperty({ example: 'Standard Unit Pricing' })
  description: string;

  @ApiProperty({ example: 1 })
  quantity: number;

  @ApiProperty({ example: 5000000 })
  unitPrice: number;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiPropertyOptional({ example: 1 })
  reservationId?: number;

  @ApiProperty({ example: 1 })
  propertyId: number;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiProperty({ example: '2026-06-15' })
  quotationDate: Date;

  @ApiProperty({ example: '2026-07-15' })
  validityDate: Date;

  @ApiProperty({ example: 5000000 })
  basePrice: number;

  @ApiPropertyOptional({ example: 50000 })
  discountAmount?: number;

  @ApiPropertyOptional({ example: 750000 })
  vatAmount?: number;

  @ApiPropertyOptional({ example: 'Special premium package list' })
  remarks?: string;

  @ApiProperty({ type: [CreateQuotationItemDto] })
  items: CreateQuotationItemDto[];
}

export class CreateBookingDto {
  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiProperty({ example: 1 })
  propertyId: number;

  @ApiProperty({ example: 1 })
  unitId: number;

  @ApiPropertyOptional({ example: 1 })
  reservationId?: number;

  @ApiPropertyOptional({ example: 1 })
  quotationId?: number;

  @ApiProperty({ example: '2026-06-15' })
  bookingDate: Date;

  @ApiProperty({ example: 100000 })
  bookingAmount: number;

  @ApiPropertyOptional({ example: 'Initial deposit paid' })
  remarks?: string;
}

export class CreateAgreementDto {
  @ApiProperty({ example: 1 })
  bookingId: number;

  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiProperty({ example: '2026-06-15' })
  agreementDate: Date;

  @ApiPropertyOptional({ example: 1 })
  agreementVersion?: number;

  @ApiPropertyOptional({ example: 'Merge fields document standard template' })
  agreementDocument?: string;
}

export class CreateContractDto {
  @ApiProperty({ example: 1 })
  agreementId: number;

  @ApiProperty({ example: 1 })
  customerId: number;

  @ApiProperty({ example: '2026-06-15' })
  contractStartDate: Date;

  @ApiProperty({ example: '2027-06-15' })
  contractEndDate: Date;

  @ApiProperty({ example: 5000000 })
  contractAmount: number;
}

export class CreateInstallmentPlanDto {
  @ApiProperty({ example: 1 })
  contractId: number;

  @ApiProperty({ example: 5000000 })
  totalContractAmount: number;

  @ApiProperty({ example: 1000000 })
  downPayment: number;

  @ApiProperty({ example: 'MONTHLY' })
  installmentFrequency: string; // MONTHLY, QUARTERLY, YEARLY

  @ApiProperty({ example: 12 })
  numberOfInstallments: number;

  @ApiPropertyOptional()
  recordPayment?: boolean;

  @ApiPropertyOptional()
  paymentMethodId?: number;

  @ApiPropertyOptional()
  paymentReference?: string;

  @ApiPropertyOptional()
  paymentDate?: string;

  @ApiPropertyOptional()
  bankName?: string;

  @ApiPropertyOptional()
  transactionReference?: string;

  @ApiPropertyOptional()
  chequeNumber?: string;

  @ApiPropertyOptional()
  remarks?: string;
}

export class CreateDiscountRequestDto {
  @ApiProperty({ example: 1 })
  quotationId: number;

  @ApiPropertyOptional({ example: 150000 })
  requestedDiscount?: number;

  @ApiPropertyOptional({ example: 3.5 })
  discountPercentage?: number;

  @ApiProperty({ example: 'Client request discount due to immediate down payment' })
  reason: string;
}

export class CreateCommissionRuleDto {
  @ApiProperty({ example: 'Agent 2% Commission Rule' })
  commissionName: string;

  @ApiProperty({ example: 'PERCENTAGE' })
  commissionType: string; // PERCENTAGE, FIXED

  @ApiProperty({ example: 2.0 })
  commissionValue: number;
}

export class CreateCommissionDto {
  @ApiProperty({ example: 1 })
  contractId: number;

  @ApiProperty({ example: 1 })
  salesRepId: number;

  @ApiProperty({ example: 1 })
  commissionRuleId: number;

  @ApiProperty({ example: 5000000 })
  saleAmount: number;

  @ApiProperty({ example: 100000 })
  commissionAmount: number;
}

export class EmailQuotationDto {
  @ApiProperty({ example: 'customer@example.com' })
  recipientEmail: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  recipientPhone?: string;

  @ApiPropertyOptional({ example: 'Your Official Quotation from IHSAN Real Estate' })
  subject?: string;

  @ApiPropertyOptional({ example: 'Please find attached the official price quote.' })
  message?: string;
}

export class ConvertReservationDto {
  @ApiPropertyOptional({ example: 1 })
  quotationId?: number;

  @ApiPropertyOptional({ example: 100000 })
  bookingAmount?: number;

  @ApiPropertyOptional({ example: 'Converted from active reservation' })
  remarks?: string;

  @ApiPropertyOptional({ example: 1 })
  createdById?: number;
}

export class RejectBookingDto {
  @ApiProperty({ example: 'Incomplete documentation or unverified source of funds' })
  rejectionReason: string;

  @ApiPropertyOptional({ example: 1 })
  reviewerId?: number;
}

export class FinanceReviewBookingDto {
  @ApiProperty({ example: 'APPROVE' })
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Bank deposit receipt confirmed on slip #ETB-883921' })
  comment?: string;

  @ApiPropertyOptional({ example: 1 })
  financeOfficerId?: number;
}

export class CancelBookingDto {
  @ApiProperty({ example: 'Client decided not to proceed with the purchase' })
  cancellationReason: string;

  @ApiPropertyOptional({ example: 1 })
  cancelledById?: number;
}

export class UpdateAgreementVersionDto {
  @ApiPropertyOptional({ example: 'Updated clause following buyer agreement amendment' })
  changeRemarks?: string;

  @ApiPropertyOptional({ example: 'Customized contract clauses' })
  agreementDocument?: string;
}

export class UpdateContractStatusDto {
  @ApiProperty({ example: 'UNDER_REVIEW' })
  status: string;

  @ApiPropertyOptional({ example: 'Contract verified by legal counsel' })
  remarks?: string;
}

export class CreateContractAmendmentDto {
  @ApiProperty({ example: 'PRICE_ADJUSTMENT' })
  amendmentType: string;

  @ApiProperty({ example: 'Adjusted total valuation' })
  amendmentDescription: string;

  @ApiPropertyOptional({ example: 4200000 })
  adjustedAmount?: number;

  @ApiPropertyOptional({ example: '2026-09-01' })
  effectiveDate?: Date;

  @ApiPropertyOptional({ example: 'Approved by management' })
  remarks?: string;
}

export class SendInstallmentReminderDto {
  @ApiPropertyOptional({ example: 'EMAIL_TELEGRAM' })
  channelCode?: string;

  @ApiPropertyOptional({ example: 'Kindly settle your upcoming installment at your earliest convenience.' })
  customNote?: string;
}

export class ReviewDiscountRequestDto {
  @ApiProperty({ example: 'APPROVE' })
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Approved by Sales Director per special volume agreement' })
  comment?: string;

  @ApiPropertyOptional({ example: 1 })
  approverId?: number;
}

export class ReviewCommissionDto {
  @ApiProperty({ example: 'APPROVE' })
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Verified contract execution and 100% down payment deposit verified' })
  remarks?: string;

  @ApiPropertyOptional({ example: 1 })
  reviewerId?: number;
}

export class CommissionsFilterDto {
  @ApiPropertyOptional({ example: 1 })
  agentId?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  endDate?: string;

  @ApiPropertyOptional({ example: 'PENDING' })
  status?: string;
}

