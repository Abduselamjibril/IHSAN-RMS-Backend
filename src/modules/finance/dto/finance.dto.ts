import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  paymentMethodName: string;

  @IsNotEmpty()
  @IsString()
  paymentMethodCode: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsNotEmpty()
  @IsNumber()
  contractId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  paymentMethodId: number;

  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @IsNotEmpty()
  @IsNumber()
  paymentAmount: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ApprovePaymentDto {
  @IsOptional()
  @IsString()
  approvalComment?: string;
}

export class CreateReceiptTemplateDto {
  @IsOptional()
  @IsString()
  templateName?: string;

  @IsOptional()
  @IsString()
  companyLogo?: string;

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  signatureText?: string;

  @IsOptional()
  @IsBoolean()
  qrEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreatePenaltyConfigDto {
  @IsOptional()
  @IsNumber()
  projectId?: number;

  @IsOptional()
  @IsNumber()
  gracePeriodDays?: number;

  @IsNotEmpty()
  @IsString()
  penaltyType: string; // FIXED, PERCENTAGE, MONTHLY

  @IsOptional()
  @IsNumber()
  penaltyPercentage?: number;

  @IsOptional()
  @IsNumber()
  fixedPenaltyAmount?: number;

  @IsOptional()
  @IsNumber()
  monthlyPenaltyRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class WaivePenaltyDto {
  @IsNotEmpty()
  @IsString()
  waiverReason: string;
}

export class CreateReminderConfigDto {
  @IsOptional()
  @IsNumber()
  reminderDaysBeforeDue?: number;

  @IsOptional()
  @IsNumber()
  reminderDaysAfterDue?: number;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  telegramEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
