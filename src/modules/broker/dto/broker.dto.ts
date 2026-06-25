import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBrokerDto {
  @IsNotEmpty()
  @IsString()
  brokerTypeId: string; // INDIVIDUAL, COMPANY

  @IsNotEmpty()
  @IsString()
  brokerName: string;

  @IsOptional()
  @IsString()
  tradeLicenseNumber?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  alternatePhoneNumber?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateBrokerDto {
  @IsOptional()
  @IsString()
  brokerTypeId?: string;

  @IsOptional()
  @IsString()
  brokerName?: string;

  @IsOptional()
  @IsString()
  tradeLicenseNumber?: string;

  @IsOptional()
  @IsString()
  tinNumber?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  alternatePhoneNumber?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  statusId?: string; // ACTIVE, INACTIVE, BLACKLISTED

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateBrokerBankAccountDto {
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class AssignProjectDto {
  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  statusId?: string;
}

export class AssignLeadDto {
  @IsNotEmpty()
  @IsNumber()
  leadId: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CommissionPlanDetailDto {
  @IsOptional()
  @IsNumber()
  fromAmount?: number;

  @IsOptional()
  @IsNumber()
  toAmount?: number;

  @IsOptional()
  @IsNumber()
  fromUnits?: number;

  @IsOptional()
  @IsNumber()
  toUnits?: number;

  @IsOptional()
  @IsNumber()
  commissionPercent?: number;

  @IsOptional()
  @IsNumber()
  fixedAmount?: number;
}

export class CreateCommissionPlanDto {
  @IsNotEmpty()
  @IsString()
  commissionPlanCode: string;

  @IsNotEmpty()
  @IsString()
  commissionPlanName: string;

  @IsNotEmpty()
  @IsString()
  commissionTypeId: string; // PERCENTAGE, FIXED, TIERED

  @IsNotEmpty()
  @IsDateString()
  effectiveFromDate: string;

  @IsOptional()
  @IsDateString()
  effectiveToDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionPlanDetailDto)
  details?: CommissionPlanDetailDto[];
}

export class AssignProjectCommissionPlanDto {
  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsNotEmpty()
  @IsNumber()
  commissionPlanId: number;

  @IsNotEmpty()
  @IsDateString()
  effectiveFromDate: string;

  @IsOptional()
  @IsDateString()
  effectiveToDate?: string;
}

export class CreateBrokerSaleDto {
  @IsNotEmpty()
  @IsNumber()
  brokerId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  propertyId: number;

  @IsOptional()
  @IsNumber()
  reservationId?: number;

  @IsOptional()
  @IsNumber()
  salesContractId?: number;

  @IsNotEmpty()
  @IsNumber()
  saleAmount: number;

  @IsNotEmpty()
  @IsDateString()
  saleDate: string;
}

export class CreateAdjustmentDto {
  @IsNotEmpty()
  @IsString()
  adjustmentTypeId: string; // INCREASE, DECREASE

  @IsNotEmpty()
  @IsNumber()
  adjustmentAmount: number;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class PaymentAllocationDto {
  @IsNotEmpty()
  @IsNumber()
  brokerCommissionId: number;

  @IsNotEmpty()
  @IsNumber()
  amountPaid: number;
}

export class RecordPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentReference: string;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodId: string; // BANK_TRANSFER, CHECK, CASH

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations: PaymentAllocationDto[];
}

export class SetTargetDto {
  @IsNotEmpty()
  @IsNumber()
  yearNumber: number;

  @IsNotEmpty()
  @IsNumber()
  monthNumber: number;

  @IsNotEmpty()
  @IsNumber()
  salesTargetCount: number;

  @IsNotEmpty()
  @IsNumber()
  salesTargetAmount: number;

  @IsOptional()
  @IsNumber()
  commissionTarget?: number;
}
