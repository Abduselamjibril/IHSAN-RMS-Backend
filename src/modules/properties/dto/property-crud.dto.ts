import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'PROP-IHSAN-TOWER-A', description: 'Unique property project code' })
  propertyCode: string;

  @ApiProperty({ example: 'Ihsan Luxury Tower A', description: 'Friendly name of the property project' })
  propertyName: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of pre-existing property type lookup' })
  propertyTypeId?: number;

  @ApiPropertyOptional({ example: 'Apartment', description: 'Dynamic Property Type Name if using "Other" dynamic option' })
  propertyTypeName?: string;

  @ApiPropertyOptional({ example: 'Premium residential tower located in central Addis Ababa', description: 'General property description' })
  description?: string;

  @ApiPropertyOptional({ example: 'Bole Sub-city, Woreda 03, Addis Ababa', description: 'Street address' })
  address?: string;

  @ApiPropertyOptional({ example: 'Ethiopia', description: 'Country location' })
  country?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa', description: 'City location' })
  city?: string;

  @ApiPropertyOptional({ example: 'Bole', description: 'Sub-city subdivision' })
  subCity?: string;

  @ApiPropertyOptional({ example: 9.03, description: 'Geographic latitude coordinate' })
  latitude?: number;

  @ApiPropertyOptional({ example: 38.74, description: 'Geographic longitude coordinate' })
  longitude?: number;

  @ApiPropertyOptional({ example: 1500.50, description: 'Total land surface area in sqm' })
  totalLandArea?: number;

  @ApiPropertyOptional({ example: 45000.00, description: 'Total gross built-up floor area in sqm' })
  totalBuiltupArea?: number;

  @ApiPropertyOptional({ example: 1, description: 'Total building count in this property project' })
  totalBuildings?: number;

  @ApiPropertyOptional({ example: 120, description: 'Total unit inventory count in this property project' })
  totalUnits?: number;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Launch date of construction project' })
  launchDate?: Date;

  @ApiPropertyOptional({ example: '2028-12-31', description: 'Projected completion date' })
  completionDate?: Date;

  @ApiPropertyOptional({ example: 'Active', description: 'Overall property status: Planning, Construction, Active, Completed' })
  propertyStatus?: string;

  @ApiPropertyOptional({ example: 'IHSAN Properties PLC', description: 'Name of developer company' })
  developerName?: string;

  @ApiPropertyOptional({ example: '+251911223344', description: 'Primary contact phone number' })
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@ihsanproperties.com', description: 'Primary contact email' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://ihsanproperties.com', description: 'Project website URL' })
  website?: string;

  @ApiPropertyOptional({ example: 'Bole residential premium highrise complex project', description: 'General remarks/internal notes' })
  remarks?: string;

  @ApiPropertyOptional({ example: [1, 2, 5], description: 'List of Amenity Master IDs to map to this property' })
  amenityIds?: number[];
}

export class UpdatePropertyDto {
  @ApiPropertyOptional({ example: 'Ihsan Premium Suites A' })
  propertyName?: string;

  @ApiPropertyOptional({ example: 1 })
  propertyTypeId?: number;

  @ApiPropertyOptional({ example: 'Apartment' })
  propertyTypeName?: string;

  @ApiPropertyOptional({ example: 'Updated project description details' })
  description?: string;

  @ApiPropertyOptional({ example: 'Bole Sub-city, Addis Ababa' })
  address?: string;

  @ApiPropertyOptional({ example: 'Ethiopia' })
  country?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  city?: string;

  @ApiPropertyOptional({ example: 'Bole' })
  subCity?: string;

  @ApiPropertyOptional({ example: 9.03 })
  latitude?: number;

  @ApiPropertyOptional({ example: 38.74 })
  longitude?: number;

  @ApiPropertyOptional({ example: 1500.50 })
  totalLandArea?: number;

  @ApiPropertyOptional({ example: 45000.00 })
  totalBuiltupArea?: number;

  @ApiPropertyOptional({ example: 1 })
  totalBuildings?: number;

  @ApiPropertyOptional({ example: 120 })
  totalUnits?: number;

  @ApiPropertyOptional({ example: '2026-06-01' })
  launchDate?: Date;

  @ApiPropertyOptional({ example: '2028-12-31' })
  completionDate?: Date;

  @ApiPropertyOptional({ example: 'Active' })
  propertyStatus?: string;

  @ApiPropertyOptional({ example: 'IHSAN Properties PLC' })
  developerName?: string;

  @ApiPropertyOptional({ example: '+251911223344' })
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'info@ihsanproperties.com' })
  contactEmail?: string;

  @ApiPropertyOptional({ example: 'https://ihsanproperties.com' })
  website?: string;

  @ApiPropertyOptional({ example: 'Updated remarks details' })
  remarks?: string;

  @ApiPropertyOptional({ example: [1, 2, 3] })
  amenityIds?: number[];
}

export class CreateBuildingDto {
  @ApiProperty({ example: 1, description: 'ID of parent Property' })
  propertyId: number;

  @ApiProperty({ example: 'BLDG-A', description: 'Unique building identifier code' })
  buildingCode: string;

  @ApiProperty({ example: 'Tower Block A', description: 'Building name' })
  buildingName: string;

  @ApiPropertyOptional({ example: 'Residential', description: 'Building function type: Residential, Commercial, Retail' })
  buildingType?: string;

  @ApiPropertyOptional({ example: 15, description: 'Total number of floors above ground level' })
  totalFloors?: number;

  @ApiPropertyOptional({ example: 2, description: 'Basement floor count for parking/storage' })
  basementFloors?: number;

  @ApiPropertyOptional({ example: 3, description: 'Elevator/lift count' })
  elevatorCount?: number;

  @ApiPropertyOptional({ example: 'Under Construction', description: 'Construction status: Planning, Excavation, Structural, Under Construction, Completed' })
  constructionStatus?: string;

  @ApiPropertyOptional({ example: 45.50, description: 'Percentage completion progress (0-100)' })
  completionPercentage?: number;

  @ApiPropertyOptional({ example: '2027-06-30', description: 'Target keys handover date' })
  handoverDate?: Date;

  @ApiPropertyOptional({ example: 'Residential block tower A', description: 'General remarks/internal notes' })
  remarks?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of parent Site lookup' })
  siteId?: number;
}

export class UpdateBuildingDto {
  @ApiPropertyOptional({ example: 'Tower Block A - Renovated' })
  buildingName?: string;

  @ApiPropertyOptional({ example: 'Mixed Use' })
  buildingType?: string;

  @ApiPropertyOptional({ example: 16 })
  totalFloors?: number;

  @ApiPropertyOptional({ example: 2 })
  basementFloors?: number;

  @ApiPropertyOptional({ example: 4 })
  elevatorCount?: number;

  @ApiPropertyOptional({ example: 'Completed' })
  constructionStatus?: string;

  @ApiPropertyOptional({ example: 100.00 })
  completionPercentage?: number;

  @ApiPropertyOptional({ example: '2027-05-15' })
  handoverDate?: Date;

  @ApiPropertyOptional({ example: 'Renovation complete' })
  remarks?: string;

  @ApiPropertyOptional({ example: 1 })
  siteId?: number;
}

export class CreateFloorDto {
  @ApiProperty({ example: 1, description: 'ID of parent Building' })
  buildingId: number;

  @ApiProperty({ example: 5, description: 'Numeric floor level (positive for floors, negative for basements)' })
  floorNumber: number;

  @ApiPropertyOptional({ example: '5th Floor Penthouse Lobby', description: 'Friendly floor name' })
  floorName?: string;

  @ApiPropertyOptional({ example: 'Residential', description: 'Floor partition type' })
  floorType?: string;

  @ApiPropertyOptional({ example: 'Lobby level penthouse floor plans mapped', description: 'Remarks' })
  remarks?: string;
}

export class UpdateFloorDto {
  @ApiPropertyOptional({ example: '5th Floor Premium Suites' })
  floorName?: string;

  @ApiPropertyOptional({ example: 'Commercial' })
  floorType?: string;

  @ApiPropertyOptional({ example: 'Updated floor details' })
  remarks?: string;
}

export class CreateSiteDto {
  @ApiProperty({ example: 'Phase 2 Complex', description: 'Name of the site phase' })
  siteName: string;

  @ApiPropertyOptional({ example: 'North Area Plot B', description: 'Physical location details' })
  siteLocation?: string;

  @ApiProperty({ example: 1, description: 'ID of parent Property project' })
  propertyId: number;
}

export class UpdateSiteDto {
  @ApiPropertyOptional({ example: 'Phase 2 Complex - West Wing' })
  siteName?: string;

  @ApiPropertyOptional({ example: 'North Area Woreda 05' })
  siteLocation?: string;
}
