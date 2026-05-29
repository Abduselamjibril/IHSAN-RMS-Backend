export class UpdateLeadDto {
  fullName?: string;
  gender?: string;
  primaryPhone?: string;
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
}
