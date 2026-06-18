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
