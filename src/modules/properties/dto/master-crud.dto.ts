export class CreatePropertyTypeDto {
  typeName: string;
  description?: string;
  isActive?: boolean;
}

export class UpdatePropertyTypeDto {
  typeName?: string;
  description?: string;
  isActive?: boolean;
}

export class CreateUnitTypeDto {
  typeName: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateUnitTypeDto {
  typeName?: string;
  description?: string;
  isActive?: boolean;
}

export class CreateAmenityDto {
  amenityName: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateAmenityDto {
  amenityName?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}
