import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 1, description: 'ID of parent Property project' })
  propertyId: number;

  @ApiProperty({ example: 1, description: 'ID of parent Building tower' })
  buildingId: number;

  @ApiProperty({ example: 1, description: 'ID of parent Floor level' })
  floorId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of Unit Type lookup' })
  unitTypeId?: number;

  @ApiPropertyOptional({ example: 'Apartment', description: 'Dynamic Unit Type Name if using "Other" dynamic option' })
  unitTypeName?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of Unit Status lookup' })
  unitStatusId?: number;

  @ApiProperty({ example: 'PROP-A-BLDG-1-FL-5-U-502', description: 'Unique barcode/identifier code for the unit' })
  unitCode: string;

  @ApiProperty({ example: '502', description: 'Unit number' })
  unitNumber: string;

  @ApiPropertyOptional({ example: '2-Bedroom Luxury Suite with city views', description: 'Friendly unit title' })
  title?: string;

  @ApiPropertyOptional({ example: 2, description: 'Bedroom count' })
  bedroomCount?: number;

  @ApiPropertyOptional({ example: 2, description: 'Bathroom count' })
  bathroomCount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Dedicated parking slot count' })
  parkingSlotCount?: number;

  @ApiPropertyOptional({ example: 120.50, description: 'Total gross surface area in sqm' })
  grossArea?: number;

  @ApiPropertyOptional({ example: 110.20, description: 'Total net usable interior floor area in sqm' })
  netArea?: number;

  @ApiPropertyOptional({ example: 10.30, description: 'Balcony area in sqm' })
  balconyArea?: number;

  @ApiPropertyOptional({ example: 'East', description: 'Facing compass direction' })
  facingDirection?: string;

  @ApiPropertyOptional({ example: 'Bole City Skyline', description: 'View type' })
  viewType?: string;

  @ApiPropertyOptional({ example: 5, description: 'Floor level numeric value' })
  floorLevel?: number;

  @ApiPropertyOptional({ example: false, description: 'Furnished status flag' })
  isFurnished?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Corner unit flag' })
  isCornerUnit?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Featured unit flag (high visibility)' })
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: ['Premium', 'Penthouse', 'Corner'], description: 'List of tags for filtering' })
  inventoryTags?: string[];

  @ApiPropertyOptional({ example: 8500000.00, description: 'Active listing price' })
  currentPrice?: number;

  @ApiPropertyOptional({ example: 'ETB', description: 'Currency code: ETB, USD' })
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'Bole Complex tower residential penthouse unit', description: 'Remarks' })
  remarks?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional({ example: 1 })
  unitTypeId?: number;

  @ApiPropertyOptional({ example: 'Apartment' })
  unitTypeName?: string;

  @ApiPropertyOptional({ example: 1 })
  unitStatusId?: number;

  @ApiPropertyOptional({ example: '502-A' })
  unitNumber?: string;

  @ApiPropertyOptional({ example: 'Updated Unit Title' })
  title?: string;

  @ApiPropertyOptional({ example: 2 })
  bedroomCount?: number;

  @ApiPropertyOptional({ example: 2 })
  bathroomCount?: number;

  @ApiPropertyOptional({ example: 1 })
  parkingSlotCount?: number;

  @ApiPropertyOptional({ example: 120.50 })
  grossArea?: number;

  @ApiPropertyOptional({ example: 110.20 })
  netArea?: number;

  @ApiPropertyOptional({ example: 10.30 })
  balconyArea?: number;

  @ApiPropertyOptional({ example: 'West' })
  facingDirection?: string;

  @ApiPropertyOptional({ example: 'Bole City Skyline' })
  viewType?: string;

  @ApiPropertyOptional({ example: 5 })
  floorLevel?: number;

  @ApiPropertyOptional({ example: true })
  isFurnished?: boolean;

  @ApiPropertyOptional({ example: true })
  isCornerUnit?: boolean;

  @ApiPropertyOptional({ example: true })
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: ['Updated', 'Corner'] })
  inventoryTags?: string[];

  @ApiPropertyOptional({ example: 9000000.00 })
  currentPrice?: number;

  @ApiPropertyOptional({ example: 'ETB' })
  currencyCode?: string;

  @ApiPropertyOptional({ example: 'Updated remarks' })
  remarks?: string;
}

export class UpdateUnitStatusDto {
  @ApiPropertyOptional({ example: 2, description: 'ID of new target Unit Status lookup' })
  statusId?: number;

  @ApiPropertyOptional({ example: 'Reserved', description: 'Alternately, name of new target status lookup' })
  statusName?: string;

  @ApiPropertyOptional({ example: 'Customer paid reservation deposit fee', description: 'Transition reason note' })
  reason?: string;

  @ApiPropertyOptional({ example: 48, description: 'For Reserved: hours until temporary lock release auto-expiry' })
  reservationExpiryHours?: number;
}

export class CreateUnitPriceDto {
  @ApiProperty({ example: 1, description: 'ID of target Unit' })
  unitId: number;

  @ApiProperty({ example: 8500000.00, description: 'Base listing price value' })
  basePrice: number;

  @ApiPropertyOptional({ example: 70833.33, description: 'Computed price per sqm' })
  pricePerSqm?: number;

  @ApiPropertyOptional({ example: 'ETB', default: 'ETB', description: 'Currency code: ETB, USD' })
  currencyCode?: string;

  @ApiPropertyOptional({ example: 15.00, description: 'VAT / sales tax percentage' })
  taxPercentage?: number;

  @ApiPropertyOptional({ example: 5.00, description: 'Max allowed discount percentage' })
  discountPercentage?: number;

  @ApiPropertyOptional({ example: true, description: 'Price negotiable flag' })
  isNegotiable?: boolean;

  @ApiProperty({ example: '2026-06-01', description: 'Effective start date of pricing' })
  effectiveFrom: Date;

  @ApiPropertyOptional({ example: '2027-06-01', description: 'Effective end date of pricing' })
  effectiveTo?: Date;

  @ApiPropertyOptional({ example: 'Opening launch price configuration', description: 'Remarks' })
  remarks?: string;
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'Bole Launch Promotion', description: 'Discount campaign name' })
  promotionName: string;

  @ApiPropertyOptional({ example: 'Early Bird', description: 'Promotion type tag' })
  promotionType?: string;

  @ApiPropertyOptional({ example: 5.00, description: 'Discount percentage value (0-100)' })
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 100000.00, description: 'Alternately, fixed discount amount' })
  fixedDiscountAmount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Optional property project scope restriction' })
  applicablePropertyId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Optional unit type category scope restriction' })
  applicableUnitTypeId?: number;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Start date of discount validity' })
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-08-31', description: 'End date of discount validity' })
  endDate?: Date;

  @ApiPropertyOptional({ example: 'Active promotional campaigns', description: 'Remarks' })
  remarks?: string;
}
