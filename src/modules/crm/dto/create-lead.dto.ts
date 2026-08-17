import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsArray, Min, ValidateIf } from 'class-validator';

export class CreateLeadContactDto {
  @ApiProperty({ example: 'Abebech Kebede', description: 'Contact person full name' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiProperty({ example: 'Spouse', description: 'Relationship to the lead' })
  @IsString()
  @IsNotEmpty()
  relationshipType: string;

  @ApiPropertyOptional({ example: '+251911999999', description: 'Contact phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'abebech@example.com', description: 'Contact email' })
  @ValidateIf((o) => !!o.email && o.email.trim() !== '')
  @IsEmail({}, { message: 'Invalid contact email format' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this the primary alternative contact?' })
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 'Available during weekends for call', description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the lead' })
  @IsString()
  @IsNotEmpty({ message: 'Full Name is required' })
  fullName: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender of the lead (Male/Female)' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: '+251911223344', description: 'Primary phone number' })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  primaryPhone: string;

  @ApiPropertyOptional({ example: '+251911556677', description: 'Secondary phone number' })
  @IsString()
  @IsOptional()
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Primary email' })
  @ValidateIf((o) => !!o.primaryEmail && o.primaryEmail.trim() !== '')
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'john.work@example.com', description: 'Secondary email' })
  @ValidateIf((o) => !!o.secondaryEmail && o.secondaryEmail.trim() !== '')
  @IsEmail({}, { message: 'Invalid secondary email format' })
  @IsOptional()
  secondaryEmail?: string;

  @ApiPropertyOptional({ example: 'Ethiopian', description: 'Nationality' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa', description: 'City of residence' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Ethiopia', description: 'Country of residence' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Phone', description: 'Preferred contact method (Phone, Email, WhatsApp, Telegram)' })
  @IsString()
  @IsOptional()
  preferredContactMethod?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Minimum budget in ETB/USD' })
  @IsNumber()
  @Min(0, { message: 'Budget Min cannot be negative' })
  @IsOptional()
  budgetMin?: number;

  @ApiPropertyOptional({ example: 250000, description: 'Maximum budget in ETB/USD' })
  @IsNumber()
  @Min(0, { message: 'Budget Max cannot be negative' })
  @IsOptional()
  budgetMax?: number;

  @ApiProperty({ example: '3 Bedroom Apartment', description: 'Property type of interest (Apartment, Villa, Plot, Commercial)' })
  @IsString()
  @IsNotEmpty({ message: 'Interested Project is required' })
  interestedPropertyType: string;

  @ApiProperty({ example: 1, description: 'Lead source ID' })
  @IsNumber()
  @IsNotEmpty({ message: 'Lead Source is required' })
  leadSourceId: number;

  @ApiPropertyOptional({ example: 1, description: 'Lead status ID' })
  @IsNumber()
  @IsOptional()
  leadStatusId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Assigned sales agent ID' })
  @IsNumber()
  @IsOptional()
  assignedSalesAgentId?: number;

  @ApiPropertyOptional({ example: 'First-time home buyer, interested in 2-bedroom apartment', description: 'General remarks/notes' })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({ type: [CreateLeadContactDto], description: 'Optional list of additional contact persons' })
  @IsArray()
  @IsOptional()
  contacts?: CreateLeadContactDto[];
}

