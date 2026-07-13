import { IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, IsArray, IsBoolean } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  categoryCode: string; // 'PAYMENT', 'RESERVATION', 'FOLLOWUP', 'APPROVAL', 'MARKETING', 'SYSTEM'

  @IsString()
  @IsOptional()
  templateCode?: string;

  @IsString()
  @IsOptional()
  referenceTypeId?: string;

  @IsNumber()
  @IsOptional()
  referenceId?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;

  @IsString()
  @IsOptional()
  priority?: string; // 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'

  @IsArray()
  @IsNotEmpty()
  recipients: Array<{
    userId?: number;
    recipientName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    pushToken?: string;
  }>;

  @IsOptional()
  scheduledDate?: Date;
}

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @IsString()
  @IsNotEmpty()
  templateName: string;

  @IsString()
  @IsOptional()
  subjectTemplate?: string;

  @IsString()
  @IsNotEmpty()
  bodyTemplate: string;

  @IsString()
  @IsNotEmpty()
  channelCode: string; // 'EMAIL', 'SMS', 'PUSH', 'INAPP', 'TELEGRAM'

  @IsArray()
  @IsOptional()
  variables?: string[];
}

export class UpdateTemplateDto {
  @IsString()
  @IsOptional()
  templateName?: string;

  @IsString()
  @IsOptional()
  subjectTemplate?: string;

  @IsString()
  @IsOptional()
  bodyTemplate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
