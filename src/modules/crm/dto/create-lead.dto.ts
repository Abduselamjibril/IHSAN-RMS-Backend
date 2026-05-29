export class CreateLeadDto {
  fullName: string;
  gender?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  primaryEmail?: string;
  secondaryEmail?: string;
  nationality?: string;
  city?: string;
  country?: string;
  preferredContactMethod?: string;
  budgetMin?: number;
  budgetMax?: number;
  interestedPropertyType?: string;
  leadSourceId?: number;
  leadStatusId?: number;
  assignedSalesAgentId?: number;
  remarks?: string;
  contacts?: {
    contactName: string;
    relationshipType: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
    notes?: string;
  }[];
}
