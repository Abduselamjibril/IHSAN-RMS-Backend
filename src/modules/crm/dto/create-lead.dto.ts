import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadContactDto {
  @ApiProperty({ example: 'Abebech Kebede', description: 'Contact person full name' })
  contactName: string;

  @ApiProperty({ example: 'Spouse', description: 'Relationship to the lead' })
  relationshipType: string;

  @ApiPropertyOptional({ example: '+251911999999', description: 'Contact phone number' })
  phone?: string;

  @ApiPropertyOptional({ example: 'abebech@example.com', description: 'Contact email' })
  email?: string;

  @ApiPropertyOptional({ example: false, description: 'Is this the primary alternative contact?' })
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 'Available during weekends for call', description: 'Notes' })
  notes?: string;
}

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the lead' })
  fullName: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender of the lead (Male/Female)' })
  gender?: string;

  @ApiProperty({ example: '+251911223344', description: 'Primary phone number' })
  primaryPhone: string;

  @ApiPropertyOptional({ example: '+251911556677', description: 'Secondary phone number' })
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Primary email' })
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'john.work@example.com', description: 'Secondary email' })
  secondaryEmail?: string;

  @ApiPropertyOptional({ example: 'Ethiopian', description: 'Nationality' })
  nationality?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa', description: 'City of residence' })
  city?: string;

  @ApiPropertyOptional({ example: 'Ethiopia', description: 'Country of residence' })
  country?: string;

  @ApiPropertyOptional({ example: 'Phone', description: 'Preferred contact method (Phone, Email, WhatsApp, Telegram)' })
  preferredContactMethod?: string;

  @ApiPropertyOptional({ example: 150000, description: 'Minimum budget in ETB/USD' })
  budgetMin?: number;

  @ApiPropertyOptional({ example: 250000, description: 'Maximum budget in ETB/USD' })
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'Apartment', description: 'Property type of interest (Apartment, Villa, Plot, Commercial)' })
  interestedPropertyType?: string;

  @ApiPropertyOptional({ example: 1, description: 'Lead source ID' })
  leadSourceId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Lead status ID' })
  leadStatusId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Assigned sales agent ID' })
  assignedSalesAgentId?: number;

  @ApiPropertyOptional({ example: 'First-time home buyer, interested in 2-bedroom apartment', description: 'General remarks/notes' })
  remarks?: string;

  @ApiPropertyOptional({ type: [CreateLeadContactDto], description: 'Optional list of additional contact persons' })
  contacts?: CreateLeadContactDto[];
}

