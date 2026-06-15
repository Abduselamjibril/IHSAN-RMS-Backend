import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'John Doe Update', description: 'Updated full name' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Updated gender' })
  gender?: string;

  @ApiPropertyOptional({ example: '+251911223344', description: 'Updated primary phone number' })
  primaryPhone?: string;

  @ApiPropertyOptional({ example: '+251911556677', description: 'Updated secondary phone number' })
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com', description: 'Updated primary email' })
  primaryEmail?: string;

  @ApiPropertyOptional({ example: 'john.work@example.com', description: 'Updated secondary email' })
  secondaryEmail?: string;

  @ApiPropertyOptional({ example: 'Ethiopian', description: 'Updated nationality' })
  nationality?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa', description: 'Updated city' })
  city?: string;

  @ApiPropertyOptional({ example: 'Ethiopia', description: 'Updated country' })
  country?: string;

  @ApiPropertyOptional({ example: 'Phone', description: 'Updated preferred contact method' })
  preferredContactMethod?: string;

  @ApiPropertyOptional({ example: 180000, description: 'Updated minimum budget' })
  budgetMin?: number;

  @ApiPropertyOptional({ example: 300000, description: 'Updated maximum budget' })
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'Villa', description: 'Updated property type interest' })
  interestedPropertyType?: string;

  @ApiPropertyOptional({ example: 1, description: 'Updated lead source ID' })
  leadSourceId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Updated lead status ID' })
  leadStatusId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Updated assigned sales agent ID' })
  assignedSalesAgentId?: number;

  @ApiPropertyOptional({ example: 'Updated remarks and preferences', description: 'Updated lead remarks' })
  remarks?: string;
}

