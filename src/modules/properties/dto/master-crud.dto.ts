import { AllowProperties } from '../../../common/validation/dto-whitelist';

@AllowProperties('typeName', 'description', 'isActive')
export class CreatePropertyTypeDto {
  typeName: string;
  description?: string;
  isActive?: boolean;
}

@AllowProperties('typeName', 'description', 'isActive')
export class UpdatePropertyTypeDto {
  typeName?: string;
  description?: string;
  isActive?: boolean;
}

@AllowProperties('typeName', 'description', 'isActive')
export class CreateUnitTypeDto {
  typeName: string;
  description?: string;
  isActive?: boolean;
}

@AllowProperties('typeName', 'description', 'isActive')
export class UpdateUnitTypeDto {
  typeName?: string;
  description?: string;
  isActive?: boolean;
}

@AllowProperties('amenityName', 'icon', 'description', 'isActive')
export class CreateAmenityDto {
  amenityName: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

@AllowProperties('amenityName', 'icon', 'description', 'isActive')
export class UpdateAmenityDto {
  amenityName?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}
