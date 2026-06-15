import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PropertyType } from './entities/property-type.entity';
import { Property } from './entities/property.entity';
import { Building } from './entities/building.entity';
import { Floor } from './entities/floor.entity';
import { UnitType } from './entities/unit-type.entity';
import { UnitStatus } from './entities/unit-status.entity';
import { Unit } from './entities/unit.entity';
import { UnitStatusHistory } from './entities/unit-status-history.entity';
import { UnitPrice } from './entities/unit-price.entity';
import { UnitPriceHistory } from './entities/unit-price-history.entity';
import { PricePromotion } from './entities/price-promotion.entity';
import { PropertyMedia } from './entities/property-media.entity';
import { PropertyDocument } from './entities/property-document.entity';
import { FloorPlan } from './entities/floor-plan.entity';
import { Site } from './entities/site.entity';
import { AmenityMaster } from './entities/amenity-master.entity';
import { PropertyAmenity } from './entities/property-amenity.entity';
import { UnitImportLog } from './entities/unit-import-log.entity';

// Controllers
import { PropertyTypesController } from './controllers/property-types.controller';
import { UnitTypesController } from './controllers/unit-types.controller';
import { AmenitiesController } from './controllers/amenities.controller';
import { PropertiesController } from './controllers/properties.controller';
import { SitesController } from './controllers/sites.controller';
import { UnitsController } from './controllers/units.controller';
import { PricingController } from './controllers/pricing.controller';
import { MediaController } from './controllers/media.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { UnitStatusesController } from './controllers/unit-statuses.controller';

// Services
import { PropertiesSeederService } from './properties-seeder.service';
import { PropertyTypesService } from './services/property-types.service';
import { UnitTypesService } from './services/unit-types.service';
import { AmenitiesService } from './services/amenities.service';
import { PropertiesService } from './services/properties.service';
import { SitesService } from './services/sites.service';
import { UnitsService } from './services/units.service';
import { PricingService } from './services/pricing.service';
import { MediaService } from './services/media.service';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PropertyType,
      Property,
      Building,
      Floor,
      UnitType,
      UnitStatus,
      Unit,
      UnitStatusHistory,
      UnitPrice,
      UnitPriceHistory,
      PricePromotion,
      PropertyMedia,
      PropertyDocument,
      FloorPlan,
      Site,
      AmenityMaster,
      PropertyAmenity,
      UnitImportLog,
    ]),
  ],
  controllers: [
    PropertyTypesController,
    UnitTypesController,
    AmenitiesController,
    PropertiesController,
    SitesController,
    UnitsController,
    PricingController,
    MediaController,
    DashboardController,
    UnitStatusesController,
  ],
  providers: [
    PropertiesSeederService,
    PropertyTypesService,
    UnitTypesService,
    AmenitiesService,
    PropertiesService,
    SitesService,
    UnitsService,
    PricingService,
    MediaService,
    DashboardService,
  ],
  exports: [
    TypeOrmModule,
    PropertyTypesService,
    UnitTypesService,
    AmenitiesService,
    PropertiesService,
    SitesService,
    UnitsService,
    PricingService,
    MediaService,
    DashboardService,
  ],
})
export class PropertiesModule {}
