import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// New Module Entities
import { ReportTemplate } from './entities/report-template.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { DashboardSnapshot } from './entities/dashboard-snapshot.entity';

// Entities from other modules
import { Site } from '../properties/entities/site.entity';
import { Property } from '../properties/entities/property.entity';
import { Building } from '../properties/entities/building.entity';
import { Floor } from '../properties/entities/floor.entity';
import { Unit } from '../properties/entities/unit.entity';
import { SalesContract } from '../sales/entities/sales-contract.entity';
import { SalesReservation } from '../sales/entities/sales-reservation.entity';
import { SalesBooking } from '../sales/entities/sales-booking.entity';
import { InstallmentSchedule } from '../sales/entities/installment-schedule.entity';
import { Payment } from '../finance/entities/payment.entity';
import { CustomerBalance } from '../finance/entities/customer-balance.entity';
import { Broker } from '../broker/entities/broker.entity';
import { BrokerSale } from '../broker/entities/broker-sale.entity';
import { BrokerCommission } from '../broker/entities/broker-commission.entity';
import { Lead } from '../crm/entities/lead.entity';
import { LeadActivity } from '../crm/entities/lead-activity.entity';
import { LeadSource } from '../crm/entities/lead-source.entity';

// Module Services, Controllers & Gateways
import { ReportsService } from './services/reports.service';
import { DashboardService } from './services/dashboard.service';
import { ReportsController } from './controllers/reports.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { ReportsGateway } from './gateways/reports.gateway';
import { ReportsSubscriber } from './subscribers/reports.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReportTemplate,
      ReportSchedule,
      DashboardSnapshot,
      Site,
      Property,
      Building,
      Floor,
      Unit,
      SalesContract,
      SalesReservation,
      SalesBooking,
      InstallmentSchedule,
      Payment,
      CustomerBalance,
      Broker,
      BrokerSale,
      BrokerCommission,
      Lead,
      LeadActivity,
      LeadSource,
    ]),
  ],
  controllers: [ReportsController, DashboardController],
  providers: [ReportsService, DashboardService, ReportsGateway, ReportsSubscriber],
  exports: [ReportsService, DashboardService],
})
export class ReportsModule {}
